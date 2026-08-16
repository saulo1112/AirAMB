# Scripts/main_pm25.py
"""
Main entry point for the PyWebView-based application.

- Uses PyWebView to create a desktop window that loads the web GUI.
- Catches global errors to avoid silent crashes in the .exe.
- Runs the create_window() function defined in GUI/app.py.
"""

from __future__ import annotations

import sys
import traceback

from GUI import app
from Scripts.config import APP_NAME


def run_app_wrapper() -> None:
    """
    Wraps the GUI execution in a global try/except so the
    traceback can be shown in the console if something crashes.
    """
    try:
        # Launch the main window (defined in GUI/app.py)
        app.create_window(APP_NAME)

    except Exception as exc:
        # Build the full traceback as a string
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        print(f"\n--- UNEXPECTED ERROR IN {APP_NAME} ---\n", file=sys.stderr)
        print(tb, file=sys.stderr)

        input(
            "\nAn unexpected error occurred.\n"
            "Press ENTER to close the application..."
        )


if __name__ == "__main__":
    run_app_wrapper()
