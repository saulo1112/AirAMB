// GUI/web_predict.js
// Browser-only replacement for the Python backend (GUI/app.py), used when the page
// is served as a static site (GitHub Pages) and window.pywebview is not available.
//
// It ports, from Scripts/:
//   - validation_pm25.py  -> validateAndCastInputs
//   - features_pm25.py    -> buildFeatureVector
//   - predict_pm25.py     -> predict (Random Forest evaluated in JS)
// and, from GUI/app.py, the PDF report (export_pdf) using jsPDF.
//
// The forest is exported by Scripts/export_web_model.py into GUI/model/.

(function () {
  'use strict';

  const MODEL_BIN = 'model/pm25_rf.bin.gz';
  const MODEL_META = 'model/pm25_rf.json';

  // ---------------------------------------------------------------------------
  // Validation (mirrors Scripts/validation_pm25.py)
  // ---------------------------------------------------------------------------

  const REQUIRED_FIELDS = [
    'est_santa_cruz_gir_n_pm10',
    'est_santa_cruz_gir_n_pm2_5',
    'est_santa_cruz_gir_n',
    'est_santa_cruz_gir_n_lluvia',
    'est_santa_cruz_gir_n_humedad',
    'est_santa_cruz_gir_n_dir',
    'est_santa_cruz_gir_n_vel',
    'est_santa_cruz_gir_n_rad',
    'pm25_lag1', 'pm10_lag1',
    'pm25_lag2', 'pm10_lag2',
    'pm25_lag3', 'pm10_lag3',
    'hour',
    'dayofweek',
    'month',
  ];

  const NON_NEGATIVE_FIELDS = [
    'est_santa_cruz_gir_n_pm10',
    'est_santa_cruz_gir_n_pm2_5',
    'est_santa_cruz_gir_n_lluvia',
    'est_santa_cruz_gir_n_humedad',
    'est_santa_cruz_gir_n_vel',
    'est_santa_cruz_gir_n_rad',
    'pm25_lag1', 'pm25_lag2', 'pm25_lag3',
    'pm10_lag1', 'pm10_lag2', 'pm10_lag3',
  ];

  const PM_FIELDS = [
    'est_santa_cruz_gir_n_pm2_5',
    'est_santa_cruz_gir_n_pm10',
    'pm25_lag1', 'pm25_lag2', 'pm25_lag3',
    'pm10_lag1', 'pm10_lag2', 'pm10_lag3',
  ];

  function toFloat(value, fieldName) {
    // Python's float(None) raises; so do empty strings and NaN here.
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') {
      throw new Error(`Field '${fieldName}' must be a valid number.`);
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`Field '${fieldName}' must be a valid number.`);
    }
    return n;
  }

  function validateAndCastInputs(raw) {
    const missing = REQUIRED_FIELDS.filter((f) => !(f in raw));
    if (missing.length) {
      throw new Error(
        `Missing required fields: ${missing.join(', ')}. Please fill in all input parameters.`
      );
    }

    const cleaned = {};
    REQUIRED_FIELDS.forEach((f) => { cleaned[f] = toFloat(raw[f], f); });

    NON_NEGATIVE_FIELDS.forEach((f) => {
      if (cleaned[f] < 0) throw new Error(`Field '${f}' cannot be negative.`);
    });

    PM_FIELDS.forEach((f) => {
      if (cleaned[f] > 1000) {
        throw new Error(
          `The value of '${f}' is unusually high (>1000 µg/m³). Check for a possible typo.`
        );
      }
    });

    const dir = cleaned.est_santa_cruz_gir_n_dir;
    if (!(dir >= 0 && dir <= 360)) {
      throw new Error('Wind direction must be between 0 and 360 degrees.');
    }
    if (!(cleaned.hour >= 0 && cleaned.hour <= 23)) {
      throw new Error('The hour of day must be between 0 and 23.');
    }
    if (!(cleaned.dayofweek >= 0 && cleaned.dayofweek <= 6)) {
      throw new Error('The day of week must be between 0 and 6.');
    }
    if (!(cleaned.month >= 1 && cleaned.month <= 12)) {
      throw new Error('The month must be between 1 and 12.');
    }
    const hum = cleaned.est_santa_cruz_gir_n_humedad;
    if (!(hum >= 0 && hum <= 100)) {
      throw new Error(
        "Relative humidity must be between 0 and 100 (check 'est_santa_cruz_gir_n_humedad')."
      );
    }
    return cleaned;
  }

  // ---------------------------------------------------------------------------
  // Features (mirrors Scripts/features_pm25.py)
  // ---------------------------------------------------------------------------

  function buildFeatureVector(inputs, featureCols) {
    const row = Object.assign({}, inputs);
    row.hour_sin = Math.sin((2 * Math.PI * row.hour) / 24.0);
    row.hour_cos = Math.cos((2 * Math.PI * row.hour) / 24.0);
    row.dow_sin = Math.sin((2 * Math.PI * row.dayofweek) / 7.0);
    row.dow_cos = Math.cos((2 * Math.PI * row.dayofweek) / 7.0);

    const missing = featureCols.filter((c) => !(c in row));
    if (missing.length) {
      throw new Error(`Missing columns in the input data: ${missing.join(', ')}.`);
    }
    // scikit-learn casts the input to float32 before traversing the trees.
    return Float32Array.from(featureCols, (c) => row[c]);
  }

  // ---------------------------------------------------------------------------
  // Random Forest (exported by Scripts/export_web_model.py)
  // ---------------------------------------------------------------------------

  let modelPromise = null;

  async function gunzip(response) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser does not support DecompressionStream. Please update it.');
    }
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  function loadModel() {
    if (!modelPromise) {
      modelPromise = (async () => {
        const [metaRes, binRes] = await Promise.all([fetch(MODEL_META), fetch(MODEL_BIN)]);
        if (!metaRes.ok || !binRes.ok) {
          throw new Error('Could not download the prediction model.');
        }
        const meta = await metaRes.json();
        const buf = await gunzip(binRes);

        const n = meta.n_nodes;
        // Layout: feature uint8[n] | right uint32[n] | thr float32[n]
        // The exporter writes the arrays back to back without padding, so copy the
        // parts that start at an unaligned offset into fresh buffers.
        const feature = new Uint8Array(buf, 0, n);
        const right = new Uint32Array(buf.slice(n, n + 4 * n));
        const thr = new Float32Array(buf.slice(n + 4 * n, n + 8 * n));

        return { meta, feature, right, thr };
      })().catch((err) => {
        modelPromise = null; // allow a retry on the next click
        throw err;
      });
    }
    return modelPromise;
  }

  function forestPredict(model, x) {
    const { meta, feature, right, thr } = model;
    const leaf = meta.leaf;
    let sum = 0;
    for (let t = 0; t < meta.n_trees; t++) {
      let i = meta.roots[t];
      while (feature[i] !== leaf) {
        i = x[feature[i]] <= thr[i] ? i + 1 : i + right[i];
      }
      sum += thr[i];
    }
    return sum / meta.n_trees;
  }

  async function predict(rawInputs) {
    const cleaned = validateAndCastInputs(rawInputs);
    const model = await loadModel();
    const x = buildFeatureVector(cleaned, model.meta.feature_cols);
    return forestPredict(model, x);
  }

  // ---------------------------------------------------------------------------
  // PDF report (mirrors Api.export_pdf in GUI/app.py)
  // ---------------------------------------------------------------------------

  const SUBSCRIPTS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
                       '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  async function exportPdf(payload) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('The PDF library (jsPDF) could not be loaded.');
    }
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const now = new Date();
    let y = 40; // top margin; jsPDF's origin is the top-left corner

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('PM2.5 (t+1) Prediction Report', 40, y);
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
                  `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    doc.text(`Date and time: ${stamp}`, 40, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Input values:', 40, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    (payload.inputs || []).forEach((item) => {
      const label = (item.label || item.feature || 'Variable')
        .replace(/[₀-₉]/g, (c) => SUBSCRIPTS[c]);
      const value = item.value === undefined ? '—' : item.value;
      if (y > height - 60) {
        doc.addPage();
        y = 40;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      doc.text(`- ${label}: ${value}`, 50, y);
      y += 14;
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PM2.5 (t+1) prediction:', 40, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.text(payload.prediction || '—', 50, y);
    y += 20;

    try {
      const img = await loadImage('Assets/Tabla.png');
      // Fit the image in a 360x180 box, keeping its aspect ratio, centered.
      const scale = Math.min(360 / img.naturalWidth, 180 / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      if (y + 180 > height - 40) {
        doc.addPage();
        y = 60;
      }
      doc.addImage(img, 'PNG', (width - w) / 2, y + (180 - h) / 2, w, h);
      y += 180 + 12;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text(
        'Source: Colombian Ministry of Environment and Sustainable Development - ' +
        'Resolution 2254 of 2017 (Table 4).',
        40, y
      );
    } catch (err) {
      console.warn('[PDF] Reference table image not available:', err);
    }

    const filename = `reporte_pm25_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
                     `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.pdf`;
    doc.save(filename);
    return filename;
  }

  window.AirAMBWeb = { predict, exportPdf, loadModel };
})();
