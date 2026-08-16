# predict_pm25.py
"""
Inference module for the PM2.5 model.

- Loads the trained model (Random Forest) from best_rf_pm25.pkl.
- Builds the feature vector from the raw inputs
  (done by build_feature_vector in features_pm25.py).
- Returns the PM2.5 (t+1) prediction as a float.

This module is meant to be used both from the GUI (app_pm25.py)
and from console test scripts.
"""

from __future__ import annotations

from typing import Dict, Any, Optional

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from Scripts.features_pm25 import build_feature_vector
from Scripts.config import resource_path


# Relative path of the model bundle within the project
MODEL_REL_PATH = "Modelo/best_rf_pm25.pkl"


# ==========================
# Lazy model loading
# ==========================

_MODEL: Optional[Any] = None
_FEATURE_COLS: Optional[list[str]] = None


def _load_model() -> None:
    """
    Loads the model and the feature columns from best_rf_pm25.pkl
    only the first time it is needed.
    """
    global _MODEL, _FEATURE_COLS

    if _MODEL is not None:
        return

    # Uses the shared helper, which works the same in development and in the .exe
    bundle_path = resource_path(MODEL_REL_PATH)

    bundle = joblib.load(bundle_path)

    # Expected format:
    # dict {"model": RandomForestRegressor, "feature_cols": [...]}
    # Alternative format: model directly (not recommended)
    if isinstance(bundle, dict) and "model" in bundle:
        _MODEL = bundle["model"]
        _FEATURE_COLS = bundle.get("feature_cols")
    else:
        _MODEL = bundle
        _FEATURE_COLS = None  # falls back to the order built by build_feature_vector


def get_expected_feature_cols() -> Optional[list[str]]:
    """
    Returns the list of feature columns the model expects,
    if available in the .pkl. This can be used to check
    consistency between training and inference.
    """
    _load_model()
    return _FEATURE_COLS


# ==========================
# Main usage function
# ==========================

def predict_pm25(user_inputs: Dict[str, Any]) -> float:
    """
    Predicts the PM2.5 (t+1) concentration from the input values.

    Parameters
    ----------
    user_inputs : dict
        Dictionary with the raw values entered by the user
        (current concentrations, PM2.5/PM10 lags, hour, day of week,
        month, meteorological variables, etc.). The keys must match
        what build_feature_vector expects.

    Returns
    -------
    float
        Estimated PM2.5 value for the next hour (t+1) in µg/m³.
    """
    _load_model()
    assert _MODEL is not None

    # Build the single-row DataFrame with the same schema
    # used for X_train (internal feature engineering).
    X: pd.DataFrame = build_feature_vector(
        user_inputs,
        expected_cols=_FEATURE_COLS,
    )

    # RandomForestRegressor.predict returns an array of length 1
    y_hat = _MODEL.predict(X)[0]

    return float(y_hat)
