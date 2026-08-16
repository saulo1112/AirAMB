# GUI/app.py
import os
import sys
import json
import webview

from Scripts.config import APP_NAME as AirAMB, resource_path
from Scripts.validation_pm25 import validate_and_cast_inputs
from Scripts.predict_pm25 import predict_pm25

from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def get_reports_dir() -> Path:
    """
    Returns the folder where PDF reports will be saved.

    - If the app is frozen (PyInstaller), uses Documents/AirAMB_Reportes.
    - If running in script mode, uses the Reportes folder next to app.py.
    """
    if getattr(sys, "frozen", False):
        # Executable (PyInstaller / Inno Setup)
        base = Path.home() / "Documents" / "AirAMB_Reportes"
    else:
        # Development mode: Reportes folder next to app.py
        base = Path(__file__).resolve().parent / "Reportes"

    base.mkdir(parents=True, exist_ok=True)
    return base


class Api:
    """
    API exposed to JavaScript.

    The frontend must call:
        const y_hat = await pywebview.api.predict(data);

    where `data` is a dict/JSON with the 17 features expected
    by validate_and_cast_inputs.
    """

    def predict(self, data):
        """
        Receives a JSON/dict with the input fields,
        validates it and returns ONLY a number (float) with the prediction.
        """
        try:
            # 1) Normalize the payload to a dict
            if isinstance(data, str):
                raw_inputs = json.loads(data)
            elif isinstance(data, dict):
                raw_inputs = data
            else:
                # pywebview may send JS dict-like objects
                raw_inputs = dict(data)

            print("[API] Received data:", raw_inputs)

            # 2) Validation + casting
            cleaned = validate_and_cast_inputs(raw_inputs)
            print("[API] Validated data:", cleaned)

            # 3) Prediction with the model
            y_pred = predict_pm25(cleaned)

            # 4) Ensure a plain float (not a list/array)
            try:
                if hasattr(y_pred, "__len__") and not isinstance(
                    y_pred, (str, bytes)
                ):
                    value = float(y_pred[0])
                else:
                    value = float(y_pred)
            except Exception:
                value = float(y_pred)

            print(f"[API] Prediction: {value:.3f}")
            return value

        except Exception as exc:
            print("[API] Error in predict:", repr(exc))
            raise exc

    def export_pdf(self, payload: dict) -> str:
        """
        Generates a PDF with the input data, the prediction
        and a centered reference table (image).

        `payload` comes from the frontend in this shape:
        {
            "inputs": [
                {"feature": "...", "label": "...", "value": "..."},
                ...
            ],
            "prediction": "22.09 µg/m³"
        }

        Returns the absolute path of the generated file.
        """
        try:
            # Reports folder
            reports_dir = get_reports_dir()

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = reports_dir / f"reporte_pm25_{timestamp}.pdf"

            c = canvas.Canvas(str(filename), pagesize=A4)
            width, height = A4

            y = height - 40

            # =========================
            # Title
            # =========================
            c.setFont("Helvetica-Bold", 16)
            c.drawString(40, y, "PM2.5 (t+1) Prediction Report")
            y -= 30

            # =========================
            # Date/time
            # =========================
            c.setFont("Helvetica", 10)
            c.drawString(
                40,
                y,
                f"Date and time: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            )
            y -= 20

            # =========================
            # Input values
            # =========================
            c.setFont("Helvetica-Bold", 12)
            c.drawString(40, y, "Input values:")
            y -= 18

            c.setFont("Helvetica", 10)
            SUBSCRIPT_MAP = str.maketrans(
                {
                    "₀": "0",
                    "₁": "1",
                    "₂": "2",
                    "₃": "3",
                    "₄": "4",
                    "₅": "5",
                    "₆": "6",
                    "₇": "7",
                    "₈": "8",
                    "₉": "9",
                }
            )

            for item in payload.get("inputs", []):
                label = item.get("label") or item.get("feature") or "Variable"
                value = item.get("value", "—")

                # Normalize subscripts for the PDF report
                label = label.translate(SUBSCRIPT_MAP)

                text = f"- {label}: {value}"

                # Page break if needed
                if y < 60:
                    c.showPage()
                    y = height - 40
                    c.setFont("Helvetica", 10)

                c.drawString(50, y, text)
                y -= 14

            # =========================
            # Prediction
            # =========================
            y -= 10
            c.setFont("Helvetica-Bold", 12)
            c.drawString(40, y, "PM2.5 (t+1) prediction:")
            y -= 20

            c.setFont("Helvetica", 12)
            prediction_text = payload.get("prediction", "—")
            c.drawString(50, y, prediction_text)

            # =========================
            # Centered reference table image
            # =========================
            y -= 20  # spacing between the prediction and the image

            tabla_path = Path(resource_path("GUI/Assets/Tabla.png"))

            if tabla_path.exists():
                # Image size (in points). Adjust if you want it bigger/smaller.
                img_width = 360
                img_height = 180

                # If there isn't enough space on the current page, start a new one
                if y - img_height < 40:
                    c.showPage()
                    y = height - 60

                # X coordinate to center the image
                x = (width - img_width) / 2

                c.drawImage(
                    str(tabla_path),
                    x,
                    y - img_height,
                    width=img_width,
                    height=img_height,
                    preserveAspectRatio=True,
                    mask="auto",
                )

                # Source text below the image
                y = y - img_height - 12
                c.setFont("Helvetica-Oblique", 9)
                source_text = (
                    "Source: Colombian Ministry of Environment and Sustainable Development - "
                    "Resolution 2254 of 2017 (Table 4)."
                )
                c.drawString(40, y, source_text)

            else:
                print(f"[API] Warning: table image not found at {tabla_path}")

            # =========================
            # Close page and save
            # =========================
            c.showPage()
            c.save()

            print(f"[API] PDF generated at: {filename}")
            # Absolute path to display in the frontend alert
            return str(filename)

        except Exception as exc:
            import traceback

            print("[API] Error generating PDF:", exc)
            traceback.print_exc()
            # Return a readable error message to the frontend
            raise RuntimeError(f"Error generating the PDF: {exc}") from exc


def create_window(window_title: str = AirAMB) -> None:
    """
    Creates and launches the webview window.

    Loads index.html from the GUI/ folder, using resource_path
    so it works the same in development and in the PyInstaller executable.
    """
    api = Api()

    html_file = resource_path("GUI/index.html")
    print("Loading HTML from:", html_file)

    window = webview.create_window(
        window_title,
        html_file,
        width=1100,
        height=720,
        js_api=api,
    )

    webview.start(debug=False)


if __name__ == "__main__":
    create_window()
