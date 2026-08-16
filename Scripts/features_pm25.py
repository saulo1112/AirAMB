# features_pm25.py
"""
Builds the feature vector for the PM2.5 model.

This module takes the raw values entered by the user
(current station concentrations, PM2.5 and PM10 lags,
temporal and meteorological variables) and returns a single-row
DataFrame with the columns in exactly the same order that
was used during model training.
"""

from __future__ import annotations

from typing import Dict, Any, Optional, List

import numpy as np
import pandas as pd


def _add_cyclic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds cyclic (sin/cos) variables from hour and day of week,
    **only if** those columns are present.

    Assumes:
    - 'hour'      in [0, 23]
    - 'dayofweek' in [0, 6]

    Note: the current model uses 'month' as an integer, without cyclic encoding.
    """
    df = df.copy()

    if "hour" in df.columns:
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)

    if "dayofweek" in df.columns:
        df["dow_sin"] = np.sin(2 * np.pi * df["dayofweek"] / 7.0)
        df["dow_cos"] = np.cos(2 * np.pi * df["dayofweek"] / 7.0)

    return df


def build_feature_vector(
    user_inputs: Dict[str, Any],
    expected_cols: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Builds the single-row DataFrame that is passed to the model.

    Parameters
    ----------
    user_inputs : dict
        Raw values entered through the interface, for example:
        {
            "est_santa_cruz_gir_n_pm10": 45.2,
            "est_santa_cruz_gir_n_pm2_5": 32.1,
            "est_santa_cruz_gir_n": 24.0,
            "est_santa_cruz_gir_n_lluvia": 0.0,
            "est_santa_cruz_gir_n_humedad": 68.0,
            "est_santa_cruz_gir_n_dir": 135.0,
            "est_santa_cruz_gir_n_vel": 1.5,
            "est_santa_cruz_gir_n_rad": 520.0,
            "pm25_lag1": 30.0,
            "pm10_lag1": 50.0,
            "pm25_lag2": 28.0,
            "pm10_lag2": 48.0,
            "pm25_lag3": 25.0,
            "pm10_lag3": 45.0,
            "hour": 10,
            "dayofweek": 2,
            "month": 11,
        }

    expected_cols : list[str] or None
        List of columns the model expects, normally obtained
        from the .pkl (bundle["feature_cols"]). If None, the
        order is taken as it results in the DataFrame after processing.

    Returns
    -------
    pd.DataFrame
        DataFrame of shape (1, n_features) ready to be passed to
        model.predict(X).
    """
    # 1) Build the base DataFrame from the raw inputs
    df = pd.DataFrame([user_inputs])

    # 2) Add cyclic variables (hour_sin/hour_cos, dow_sin/dow_cos)
    df = _add_cyclic_features(df)

    # 3) Ensure numeric types
    df = df.apply(pd.to_numeric, errors="coerce")

    # 4) If the columns expected by the model are known, reorder them
    if expected_cols is not None:
        missing = [c for c in expected_cols if c not in df.columns]
        if missing:
            raise ValueError(
                f"Missing columns in the input data: {missing}. "
                "Check that the interface variable names "
                "match the ones used during training."
            )

        # Reorder and drop extras
        df = df[expected_cols]

    return df
