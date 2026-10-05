// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

global.window = global;
const i18n = require('../GUI/i18n.js');
const { DICT, SUPPORTED } = i18n;

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('English and Spanish are both available', () => {
  assert.deepStrictEqual([...SUPPORTED].sort(), ['en', 'es']);
});

test('every language defines exactly the same keys', () => {
  const reference = Object.keys(DICT.en).sort();
  for (const lang of SUPPORTED) {
    assert.deepStrictEqual(Object.keys(DICT[lang]).sort(), reference, `keys differ in "${lang}"`);
  }
});

test('translations are not empty and keep the same {placeholders}', () => {
  for (const key of Object.keys(DICT.en)) {
    for (const lang of SUPPORTED) {
      assert.ok(DICT[lang][key].trim().length > 0, `${lang}:${key} is empty`);
      assert.deepStrictEqual(
        placeholders(DICT[lang][key]), placeholders(DICT.en[key]),
        `placeholders differ in ${lang}:${key}`
      );
    }
  }
});

test('Spanish is actually translated (not a copy of English) for UI texts', () => {
  const sameAllowed = new Set([
    'header.pill', 'model.meta', 'pdf.fallbackLabel', 'var.est_santa_cruz_gir_n_pm10', 'var.est_santa_cruz_gir_n_pm2_5',
    'var.pm25_lag1', 'var.pm25_lag2', 'var.pm25_lag3', 'var.pm10_lag1', 'var.pm10_lag2', 'var.pm10_lag3',
  ]);
  const untranslated = Object.keys(DICT.en).filter(
    (k) => DICT.en[k] === DICT.es[k] && !sameAllowed.has(k)
  );
  assert.deepStrictEqual(untranslated, []);
});

test('every data-i18n key used in index.html exists', () => {
  const html = fs.readFileSync(path.join(__dirname, '../GUI/index.html'), 'utf8');
  const used = [...html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)].map((m) => m[1]);
  used.push(...[...html.matchAll(/data-i18n-attr="[^:]+:([^"]+)"/g)].map((m) => m[1]));
  assert.ok(used.length > 20, 'expected many translated elements');
  for (const key of used) assert.ok(key in DICT.en, `index.html uses unknown key "${key}"`);
});

test('t() interpolates, switches language and falls back to the key', () => {
  i18n.setLang('en', false);
  assert.strictEqual(i18n.t('val.number', { field: 'Month' }), "Field 'Month' must be a valid number.");
  i18n.setLang('es', false);
  assert.strictEqual(i18n.t('val.number', { field: 'Mes' }), 'El campo «Mes» debe ser un número válido.');
  assert.strictEqual(i18n.t('does.not.exist'), 'does.not.exist');
  i18n.setLang('fr', false); // unsupported: ignored
  assert.strictEqual(i18n.getLang(), 'es');
});
