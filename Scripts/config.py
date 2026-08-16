# config.py
import sys
from pathlib import Path

APP_NAME = "AirAMB"

def resource_path(relative_path: str) -> str:
    """
    Returns the absolute path to a resource, both in development
    and when packaged with PyInstaller.
    Examples:
      resource_path("GUI/index.html")
      resource_path("Modelo/best_rf_pm25.pkl")
    """
    try:
        # When running as a PyInstaller executable
        base_path = Path(sys._MEIPASS)
    except AttributeError:
        # When running as a normal Python script
        # __file__ = Scripts/config.py -> parent = Scripts -> parent.parent = project root
        base_path = Path(__file__).resolve().parent.parent

    return str(base_path / relative_path)
