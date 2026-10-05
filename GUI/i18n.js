// GUI/i18n.js
// English / Spanish translations for the AirAMB interface.
//
// Markup conventions (applied by AirAMBI18n.apply):
//   data-i18n="key"        -> element.textContent = t(key)
//   data-i18n-html="key"   -> element.innerHTML   = t(key)   (only for our own strings, e.g. <sub>)
//   data-i18n-attr="attr:key" -> element.setAttribute(attr, t(key))
//
// To add a language: add an entry to DICT with the same keys as "en"
// (tests/i18n.test.js checks that every language defines every key and placeholder)
// and a button with data-lang="<code>" in index.html.

(function (root) {
  'use strict';

  const STORAGE_KEY = 'airamb.lang';

  const DICT = {
    en: {
      'doc.title': 'PM2.5 Prediction (t+1)',

      // Header
      'header.title': 'PM<sub>2.5</sub> Prediction (t+1)',
      'header.subtitle': 'Air quality forecasting system',
      'header.pill': 'ML-Powered ⚡',
      'lang.label': 'Language',

      // Input panel
      'input.title': 'Input Parameters',
      'input.subtitle': 'Enter concentration values and temporal variables',
      'group.pm25': 'PM<sub>2.5</sub> Concentrations',
      'group.pm10': 'PM<sub>10</sub> Concentrations',
      'group.temporal': 'Temporal Variables',
      'group.meteo': 'Meteorological Variables',
      'field.hour': 'Hour of day',
      'field.dayofweek': 'Day of week',
      'hint.dayofweek': '(0-6) (Monday = 0, Sunday = 6)',
      'field.month': 'Month',
      'field.rain': 'Precipitation',
      'field.radiation': 'Solar radiation',
      'field.windspeed': 'Wind speed',
      'field.winddir': 'Wind direction',
      'unit.degrees': 'degrees (°)',
      'field.humidity': 'Relative humidity',
      'field.temperature': 'Ambient temperature',
      'btn.predict': 'Predict PM <sub>2.5</sub>&nbsp;(t+1)',

      // Result panel
      'result.title': 'Prediction Result',
      'result.subtitle': 'Estimated concentration for the next hour',
      'result.idle': 'Fill out the form and click "Predict"',
      'result.calculating': 'Calculating prediction...',
      'result.error': 'An error occurred during prediction.',
      'result.errorDetail': 'Error calculating the prediction: {detail}',
      'result.errorGeneric': 'Error calculating the prediction. Please check again.',
      'model.label': 'Model:',
      'model.meta': 'Version 1.0 • Last updated: Nov 2025',
      'export.title': 'Export report',
      'export.desc': 'Generate a PDF report with the entered data and the prediction result.',
      'export.btn': 'Export PDF',

      // Footer
      'footer.main': 'System developed with Machine Learning algorithms for environmental analysis',
      'footer.units': 'PM <sub>2.5</sub> values are measured in micrograms per cubic meter (µg/m³)',

      // Alerts
      'alert.notReady': 'The application is not ready yet. Try again in a few seconds.',
      'alert.pdfUnavailable': 'The PDF export is not available in the backend.',
      'alert.pdfOk': 'Report generated successfully.\nFile path:\n{path}',
      'alert.pdfError': 'An error occurred while generating the PDF. Check the console for details.',

      // PDF report
      'pdf.title': 'PM2.5 (t+1) Prediction Report',
      'pdf.date': 'Date and time',
      'pdf.inputs': 'Input values:',
      'pdf.prediction': 'PM2.5 (t+1) prediction:',
      'pdf.source': 'Source: Colombian Ministry of Environment and Sustainable Development - Resolution 2254 of 2017 (Table 4, original in Spanish).',
      'pdf.fallbackLabel': 'Variable',

      // Variable names used in validation messages
      'var.est_santa_cruz_gir_n_pm10': 'PM10',
      'var.est_santa_cruz_gir_n_pm2_5': 'PM2.5',
      'var.est_santa_cruz_gir_n': 'Ambient temperature',
      'var.est_santa_cruz_gir_n_lluvia': 'Precipitation',
      'var.est_santa_cruz_gir_n_humedad': 'Relative humidity',
      'var.est_santa_cruz_gir_n_dir': 'Wind direction',
      'var.est_santa_cruz_gir_n_vel': 'Wind speed',
      'var.est_santa_cruz_gir_n_rad': 'Solar radiation',
      'var.pm25_lag1': 'PM2.5 (t-1)',
      'var.pm25_lag2': 'PM2.5 (t-2)',
      'var.pm25_lag3': 'PM2.5 (t-3)',
      'var.pm10_lag1': 'PM10 (t-1)',
      'var.pm10_lag2': 'PM10 (t-2)',
      'var.pm10_lag3': 'PM10 (t-3)',
      'var.hour': 'Hour of day',
      'var.dayofweek': 'Day of week',
      'var.month': 'Month',

      // Validation messages
      'val.missing': 'Missing required fields: {fields}. Please fill in all input parameters.',
      'val.number': "Field '{field}' must be a valid number.",
      'val.negative': "Field '{field}' cannot be negative.",
      'val.high': "The value of '{field}' is unusually high (>1000 µg/m³). Check for a possible typo.",
      'val.dir': 'Wind direction must be between 0 and 360 degrees.',
      'val.hour': 'The hour of day must be between 0 and 23.',
      'val.dayofweek': 'The day of week must be between 0 and 6.',
      'val.month': 'The month must be between 1 and 12.',
      'val.humidity': 'Relative humidity must be between 0 and 100.',

      // Model loading (browser backend)
      'model.downloadFailed': 'Could not download the prediction model.',
      'model.noDecompression': 'This browser does not support DecompressionStream. Please update it.',
      'pdf.libMissing': 'The PDF library (jsPDF) could not be loaded.',
    },

    es: {
      'doc.title': 'Predicción de PM2.5 (t+1)',

      'header.title': 'Predicción de PM<sub>2.5</sub> (t+1)',
      'header.subtitle': 'Sistema de pronóstico de la calidad del aire',
      'header.pill': 'Impulsado por ML ⚡',
      'lang.label': 'Idioma',

      'input.title': 'Parámetros de entrada',
      'input.subtitle': 'Ingresa los valores de concentración y las variables temporales',
      'group.pm25': 'Concentraciones de PM<sub>2.5</sub>',
      'group.pm10': 'Concentraciones de PM<sub>10</sub>',
      'group.temporal': 'Variables temporales',
      'group.meteo': 'Variables meteorológicas',
      'field.hour': 'Hora del día',
      'field.dayofweek': 'Día de la semana',
      'hint.dayofweek': '(0-6) (lunes = 0, domingo = 6)',
      'field.month': 'Mes',
      'field.rain': 'Precipitación',
      'field.radiation': 'Radiación solar',
      'field.windspeed': 'Velocidad del viento',
      'field.winddir': 'Dirección del viento',
      'unit.degrees': 'grados (°)',
      'field.humidity': 'Humedad relativa',
      'field.temperature': 'Temperatura ambiente',
      'btn.predict': 'Predecir PM <sub>2.5</sub>&nbsp;(t+1)',

      'result.title': 'Resultado de la predicción',
      'result.subtitle': 'Concentración estimada para la próxima hora',
      'result.idle': 'Completa el formulario y haz clic en «Predecir»',
      'result.calculating': 'Calculando la predicción...',
      'result.error': 'Ocurrió un error durante la predicción.',
      'result.errorDetail': 'Error al calcular la predicción: {detail}',
      'result.errorGeneric': 'Error al calcular la predicción. Revisa los datos e inténtalo de nuevo.',
      'model.label': 'Modelo:',
      'model.meta': 'Versión 1.0 • Última actualización: nov. 2025',
      'export.title': 'Exportar reporte',
      'export.desc': 'Genera un reporte en PDF con los datos ingresados y el resultado de la predicción.',
      'export.btn': 'Exportar PDF',

      'footer.main': 'Sistema desarrollado con algoritmos de aprendizaje automático para el análisis ambiental',
      'footer.units': 'Los valores de PM <sub>2.5</sub> se expresan en microgramos por metro cúbico (µg/m³)',

      'alert.notReady': 'La aplicación aún no está lista. Inténtalo de nuevo en unos segundos.',
      'alert.pdfUnavailable': 'La exportación a PDF no está disponible en el backend.',
      'alert.pdfOk': 'Reporte generado correctamente.\nRuta del archivo:\n{path}',
      'alert.pdfError': 'Ocurrió un error al generar el PDF. Revisa la consola para más detalles.',

      'pdf.title': 'Reporte de predicción de PM2.5 (t+1)',
      'pdf.date': 'Fecha y hora',
      'pdf.inputs': 'Valores de entrada:',
      'pdf.prediction': 'Predicción de PM2.5 (t+1):',
      'pdf.source': 'Fuente: Ministerio de Ambiente y Desarrollo Sostenible de Colombia - Resolución 2254 de 2017 (Tabla 4).',
      'pdf.fallbackLabel': 'Variable',

      'var.est_santa_cruz_gir_n_pm10': 'PM10',
      'var.est_santa_cruz_gir_n_pm2_5': 'PM2.5',
      'var.est_santa_cruz_gir_n': 'Temperatura ambiente',
      'var.est_santa_cruz_gir_n_lluvia': 'Precipitación',
      'var.est_santa_cruz_gir_n_humedad': 'Humedad relativa',
      'var.est_santa_cruz_gir_n_dir': 'Dirección del viento',
      'var.est_santa_cruz_gir_n_vel': 'Velocidad del viento',
      'var.est_santa_cruz_gir_n_rad': 'Radiación solar',
      'var.pm25_lag1': 'PM2.5 (t-1)',
      'var.pm25_lag2': 'PM2.5 (t-2)',
      'var.pm25_lag3': 'PM2.5 (t-3)',
      'var.pm10_lag1': 'PM10 (t-1)',
      'var.pm10_lag2': 'PM10 (t-2)',
      'var.pm10_lag3': 'PM10 (t-3)',
      'var.hour': 'Hora del día',
      'var.dayofweek': 'Día de la semana',
      'var.month': 'Mes',

      'val.missing': 'Faltan campos obligatorios: {fields}. Completa todos los parámetros de entrada.',
      'val.number': 'El campo «{field}» debe ser un número válido.',
      'val.negative': 'El campo «{field}» no puede ser negativo.',
      'val.high': 'El valor de «{field}» es inusualmente alto (>1000 µg/m³). Revisa si hay un error de digitación.',
      'val.dir': 'La dirección del viento debe estar entre 0 y 360 grados.',
      'val.hour': 'La hora del día debe estar entre 0 y 23.',
      'val.dayofweek': 'El día de la semana debe estar entre 0 y 6.',
      'val.month': 'El mes debe estar entre 1 y 12.',
      'val.humidity': 'La humedad relativa debe estar entre 0 y 100.',

      'model.downloadFailed': 'No se pudo descargar el modelo de predicción.',
      'model.noDecompression': 'Este navegador no admite DecompressionStream. Actualízalo.',
      'pdf.libMissing': 'No se pudo cargar la biblioteca de PDF (jsPDF).',
    },
  };

  const SUPPORTED = Object.keys(DICT);
  let current = 'en';

  function normalize(code) {
    const base = String(code || '').toLowerCase().slice(0, 2);
    return SUPPORTED.includes(base) ? base : null;
  }

  function readStored() {
    try { return normalize(root.localStorage && root.localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  }

  function writeStored(lang) {
    try { root.localStorage && root.localStorage.setItem(STORAGE_KEY, lang); }
    catch (e) { /* storage may be blocked; the choice just won't persist */ }
  }

  // Priority: ?lang=xx in the URL, then the saved choice, then the browser language.
  function detect() {
    let fromUrl = null;
    try { fromUrl = normalize(new URLSearchParams(root.location.search).get('lang')); }
    catch (e) { /* no location (tests) */ }
    const nav = root.navigator && (root.navigator.language || (root.navigator.languages || [])[0]);
    return fromUrl || readStored() || normalize(nav) || 'en';
  }

  function t(key, params) {
    const table = DICT[current] || DICT.en;
    let text = table[key];
    if (text === undefined) text = DICT.en[key];
    if (text === undefined) return key;
    if (params) {
      text = text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? params[name] : m));
    }
    return text;
  }

  function apply() {
    const doc = root.document;
    if (!doc) return;
    doc.documentElement.lang = current;
    doc.title = t('doc.title');
    doc.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    doc.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    doc.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const [attr, key] = el.dataset.i18nAttr.split(':');
      el.setAttribute(attr, t(key));
    });
    doc.querySelectorAll('[data-lang]').forEach((btn) => {
      const active = btn.dataset.lang === current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function setLang(lang, persist) {
    const code = normalize(lang);
    if (!code) return;
    current = code;
    if (persist !== false) writeStored(code);
    apply();
    if (root.dispatchEvent && typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('airamb:langchange', { detail: { lang: code } }));
    }
  }

  function init() {
    current = detect();
    apply();
    const doc = root.document;
    if (doc) {
      doc.querySelectorAll('[data-lang]').forEach((btn) => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
      });
    }
  }

  const api = { t, setLang, getLang: () => current, apply, init, DICT, SUPPORTED };
  root.AirAMBI18n = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
