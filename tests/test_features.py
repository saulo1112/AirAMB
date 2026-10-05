"""Tests for Scripts/features_pm25.py (feature engineering before inference)."""

import json
import math
from pathlib import Path

import pytest

from Scripts.features_pm25 import build_feature_vector

VALID = json.loads((Path(__file__).parent / "validation_cases.json").read_text(encoding="utf-8"))["valid_inputs"]

# Column order the trained model expects (feature_cols in Modelo/best_rf_pm25.pkl)
MODEL_COLS = [
    "est_santa_cruz_gir_n_pm10", "est_santa_cruz_gir_n_pm2_5", "est_santa_cruz_gir_n",
    "est_santa_cruz_gir_n_lluvia", "est_santa_cruz_gir_n_humedad", "est_santa_cruz_gir_n_dir",
    "est_santa_cruz_gir_n_vel", "est_santa_cruz_gir_n_rad",
    "pm25_lag1", "pm10_lag1", "pm25_lag2", "pm10_lag2", "pm25_lag3", "pm10_lag3",
    "hour", "hour_sin", "hour_cos", "dayofweek", "dow_sin", "dow_cos", "month",
]


def test_columns_follow_the_model_order():
    X = build_feature_vector(VALID, expected_cols=MODEL_COLS)
    assert list(X.columns) == MODEL_COLS
    assert X.shape == (1, len(MODEL_COLS))


def test_cyclic_encoding():
    X = build_feature_vector({**VALID, "hour": 6, "dayofweek": 3}, expected_cols=MODEL_COLS)
    row = X.iloc[0]
    assert row["hour_sin"] == pytest.approx(math.sin(2 * math.pi * 6 / 24))
    assert row["hour_cos"] == pytest.approx(math.cos(2 * math.pi * 6 / 24))
    assert row["dow_sin"] == pytest.approx(math.sin(2 * math.pi * 3 / 7))
    assert row["dow_cos"] == pytest.approx(math.cos(2 * math.pi * 3 / 7))


def test_midnight_and_noon_are_opposite_on_the_cosine():
    midnight = build_feature_vector({**VALID, "hour": 0}, expected_cols=MODEL_COLS).iloc[0]
    noon = build_feature_vector({**VALID, "hour": 12}, expected_cols=MODEL_COLS).iloc[0]
    assert midnight["hour_cos"] == pytest.approx(1.0)
    assert noon["hour_cos"] == pytest.approx(-1.0)


def test_missing_expected_column_is_reported():
    inputs = {k: v for k, v in VALID.items() if k != "pm25_lag1"}
    with pytest.raises(ValueError, match="pm25_lag1"):
        build_feature_vector(inputs, expected_cols=MODEL_COLS)
