"""Tests for Scripts/validation_pm25.py.

The cases live in validation_cases.json and are shared with the JavaScript port
(tests/validation.test.js), so both implementations are held to the same rules.
"""

import json
from pathlib import Path

import pytest

from Scripts.validation_pm25 import REQUIRED_FIELDS, validate_and_cast_inputs

DATA = json.loads((Path(__file__).parent / "validation_cases.json").read_text(encoding="utf-8"))


def build_inputs(case):
    inputs = dict(DATA["valid_inputs"])
    inputs.update(case.get("override", {}))
    for field in case.get("remove", []):
        inputs.pop(field, None)
    return inputs


@pytest.mark.parametrize("case", DATA["cases"], ids=lambda c: c["name"])
def test_validation_cases(case):
    inputs = build_inputs(case)
    if case["ok"]:
        cleaned = validate_and_cast_inputs(inputs)
        assert set(cleaned) == set(REQUIRED_FIELDS)
        assert all(isinstance(v, float) for v in cleaned.values())
    else:
        with pytest.raises(ValueError):
            validate_and_cast_inputs(inputs)


def test_shared_cases_cover_every_required_field():
    assert set(DATA["valid_inputs"]) == set(REQUIRED_FIELDS)
