# validation_pm25.py
"""
Validation and casting of inputs for the PM2.5 model (Random Forest).

Responsible for:
- Checking that all required fields are present (matching the raw fields
  used in X_train).
- Converting strings to float/int.
- Checking basic ranges (hour, day, month, non-negative values, etc.).

If something fails, raises a ValueError with a message ready to display in the GUI.
"""

from __future__ import annotations
from typing import Dict, Any


# Fields the interface must provide (RAW)
REQUIRED_FIELDS = [
    # Current concentrations
    "est_santa_cruz_gir_n_pm10",
    "est_santa_cruz_gir_n_pm2_5",
    "est_santa_cruz_gir_n",
    # Meteorological variables
    "est_santa_cruz_gir_n_lluvia",
    "est_santa_cruz_gir_n_humedad",
    "est_santa_cruz_gir_n_dir",
    "est_santa_cruz_gir_n_vel",
    "est_santa_cruz_gir_n_rad",
    # PM2.5 and PM10 lags
    "pm25_lag1", "pm10_lag1",
    "pm25_lag2", "pm10_lag2",
    "pm25_lag3", "pm10_lag3",
    # Temporal
    "hour",        # 0-23
    "dayofweek",   # 0-6
    "month",       # 1-12
]


def _to_float(value: Any, field_name: str) -> float:
    """Converts to float, raising a readable error if it fails."""
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Field '{field_name}' must be a valid number.")


def validate_and_cast_inputs(raw_inputs: Dict[str, Any]) -> Dict[str, float]:
    """
    Validates and converts the interface inputs.

    Parameters
    ----------
    raw_inputs : dict
        Dictionary with the values as they come from the GUI (strings).

    Returns
    -------
    dict
        Dictionary with the same fields but converted to float,
        ready to pass to predict_pm25.

    Raises
    ------
    ValueError
        If a field is missing, has a non-numeric value, or is out of range.
    """
    cleaned: Dict[str, float] = {}

    # 1) Check that all required fields are present
    missing = [f for f in REQUIRED_FIELDS if f not in raw_inputs]
    if missing:
        raise ValueError(
            f"Missing required fields: {', '.join(missing)}. "
            "Please fill in all input parameters."
        )

    # 2) Basic conversion to float
    for field in REQUIRED_FIELDS:
        cleaned[field] = _to_float(raw_inputs.get(field), field)

    # 3) Basic range rules

    # Fields that should not be negative
    non_negative_fields = [
        "est_santa_cruz_gir_n_pm10",
        "est_santa_cruz_gir_n_pm2_5",
        "est_santa_cruz_gir_n_lluvia",
        "est_santa_cruz_gir_n_humedad",
        "est_santa_cruz_gir_n_vel",
        "est_santa_cruz_gir_n_rad",
        "pm25_lag1", "pm25_lag2", "pm25_lag3",
        "pm10_lag1", "pm10_lag2", "pm10_lag3",
    ]
    for f in non_negative_fields:
        if cleaned[f] < 0:
            raise ValueError(f"Field '{f}' cannot be negative.")

    # Reasonable range for PM: 0-1000 µg/m³ (adjustable)
    pm_fields = [
        "est_santa_cruz_gir_n_pm2_5",
        "est_santa_cruz_gir_n_pm10",
        "pm25_lag1", "pm25_lag2", "pm25_lag3",
        "pm10_lag1", "pm10_lag2", "pm10_lag3",
    ]
    for f in pm_fields:
        if cleaned[f] > 1000:
            raise ValueError(
                f"The value of '{f}' is unusually high (>1000 µg/m³). "
                "Check for a possible typo."
            )

    # Range for angular / directional variables
    if not 0 <= cleaned["est_santa_cruz_gir_n_dir"] <= 360:
        raise ValueError("Wind direction must be between 0 and 360 degrees.")

    # Hour, day and month
    hour = cleaned["hour"]
    dow = cleaned["dayofweek"]
    month = cleaned["month"]

    if not 0 <= hour <= 23:
        raise ValueError("The hour of day must be between 0 and 23.")
    if not 0 <= dow <= 6:
        raise ValueError("The day of week must be between 0 and 6.")
    if not 1 <= month <= 12:
        raise ValueError("The month must be between 1 and 12.")

    # Relative humidity (if that column is a %)
    if not 0 <= cleaned["est_santa_cruz_gir_n_humedad"] <= 100:
        raise ValueError(
            "Relative humidity must be between 0 and 100 (check 'est_santa_cruz_gir_n_humedad')."
        )

    return cleaned
