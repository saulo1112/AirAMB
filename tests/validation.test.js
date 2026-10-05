// Checks the JavaScript port of the validation (GUI/web_predict.js) against the same
// cases used by the Python tests (tests/test_validation.py). Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
global.document = undefined;
require('../GUI/i18n.js');
require('../GUI/web_predict.js');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'validation_cases.json'), 'utf8'));

function buildInputs(c) {
  const inputs = { ...DATA.valid_inputs, ...(c.override || {}) };
  (c.remove || []).forEach((f) => delete inputs[f]);
  return inputs;
}

for (const c of DATA.cases) {
  test(c.name, () => {
    const inputs = buildInputs(c);
    if (c.ok) {
      const cleaned = window.AirAMBWeb.validate(inputs);
      assert.ok(Object.values(cleaned).every((v) => typeof v === 'number'));
    } else {
      assert.throws(
        () => window.AirAMBWeb.validate(inputs),
        (err) => err.i18nKey === c.i18nKey
      );
    }
  });
}

test('error messages follow the selected language', () => {
  const bad = { ...DATA.valid_inputs, hour: 30 };
  window.AirAMBI18n.setLang('en', false);
  assert.throws(() => window.AirAMBWeb.validate(bad), /hour of day must be between 0 and 23/);
  window.AirAMBI18n.setLang('es', false);
  assert.throws(() => window.AirAMBWeb.validate(bad), /hora del día debe estar entre 0 y 23/);
});
