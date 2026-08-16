# AirAMB — Hourly PM2.5 Forecasting in Bucaramanga, Colombia

Final project for the *Aprendizaje Automático* (Machine Learning) course, Specialization in Artificial Intelligence, Universidad Autónoma de Occidente (UAO) — 2025-2S.

The project predicts **hourly PM2.5 (fine particulate matter) concentration one hour ahead (t+1)** for the *Santa Cruz – Girón Norte* air-quality monitoring station in Bucaramanga, Colombia, using historical pollution and meteorological data. It covers the full pipeline — from data extraction and exploratory analysis to model training and a desktop application (**AirAMB**) that serves live predictions.

## Authors

- Jorman Alexis Muñoz Anacona
- Saulo Quiñones Góngora
- Adrian Felipe Vargas Rojas
- Luis David Hurtado Caicedo
- Manuel Castillo Rosales

**Instructor:** Juan Camilo Giraldo Londoño

## Project overview

1. **Data extraction** — hourly air-quality records pulled from Colombia's Open Data portal (Datos Abiertos Colombia) via the Socrata API.
2. **Exploratory Data Analysis (EDA)** — null-value handling, variable-name normalization across stations, seasonal/diurnal pattern analysis, correlation study between PM2.5 and meteorological variables (wind speed, humidity, solar radiation).
3. **Feature engineering** — temporal lags (t-1, t-2, t-3) for PM2.5/PM10, cyclic encodings for hour and day of week, chronological train/test split to avoid data leakage.
4. **Modeling** — three supervised regressors compared with a time-aware validation scheme:
   - **Random Forest Regressor** (best performer, selected for deployment)
   - AdaBoost
   - Ridge Regression (L2)
5. **Evaluation** — RMSE, MAE, R² on train/test, plus a computational-complexity comparison (training vs. prediction time).
6. **Deployment** — the winning model is exported to `Modelo/best_rf_pm25.pkl` and served by a desktop GUI (**AirAMB**) built with [pywebview](https://pywebview.flowrl.com/), packaged into a Windows installer.

## Repository structure

```
.
├── Notebook/            Main Jupyter notebook: data extraction, EDA, feature
│                        engineering, model training and evaluation
├── Modelo/              Trained model bundle (best_rf_pm25.pkl) — not tracked
│                        in Git, see "Getting the trained model" below
├── Scripts/             Inference pipeline used by the GUI
│   ├── config.py            App name + resource-path resolution (dev / PyInstaller)
│   ├── features_pm25.py     Builds the model's feature vector from raw inputs
│   ├── validation_pm25.py   Input validation and type casting
│   ├── predict_pm25.py      Loads the model and runs inference
│   └── main_pm25.py         Application entry point
├── GUI/                 Desktop application (AirAMB)
│   ├── app.py                pywebview backend: prediction API + PDF report export
│   ├── index.html            Frontend UI
│   ├── style.css              Styling
│   ├── Assets/                Icons used by the UI
│   └── Reportes/               Generated PDF reports (gitignored)
├── Inno Setup/           Windows installer script (Inno Setup) and license
├── Logo/                 Application icon
├── Documentos/           Final paper and presentation slides
├── build/, dist/, Ejecutable/   PyInstaller / installer build output (gitignored)
└── .gitignore
```

## The model

- **Algorithm:** Random Forest Regressor (scikit-learn)
- **Target:** PM2.5 concentration one hour ahead, `PM2.5(t+1)`
- **Station:** Santa Cruz – Girón Norte (chosen for having the best data coverage)
- **Inputs (17 features):** current PM2.5/PM10, three lags each of PM2.5 and PM10, hour, day of week, month, precipitation, solar radiation, wind speed and direction, relative humidity, ambient temperature.

Random Forest was chosen over AdaBoost and Ridge Regression for its superior test-set R² and RMSE, at the cost of a heavier (but still fast-enough) inference step.

## Getting the trained model

`Modelo/best_rf_pm25.pkl` (~170 MB) exceeds GitHub's per-file size limit and is excluded via `.gitignore`. To run the GUI locally you need to either:

- Re-run the `Notebook/` to regenerate it, or
- Obtain the file separately (e.g. a GitHub Release asset or Git LFS, if configured) and place it at `Modelo/best_rf_pm25.pkl`.

## Running the desktop app (AirAMB)

```bash
pip install -r requirements.txt   # pywebview, scikit-learn, joblib, pandas, numpy, reportlab
python Scripts/main_pm25.py
```

This opens a native window where you can enter the 17 input variables and get an instant PM2.5(t+1) prediction, with the option to export a PDF report.

A pre-built Windows installer is also available under `Inno Setup/` (built via [Inno Setup](https://jrsoftware.org/isinfo.php) from the PyInstaller output in `dist/`).

## Notebook

The full analysis lives in [`Notebook/Proyecto_(ML)_Grupo_2.ipynb`](Notebook/Proyecto_(ML)_Grupo_2.ipynb): data extraction, EDA, feature engineering, model comparison, and validation of individual predictions against real observations.

## License

The AirAMB application code is released under the MIT-style license in [`Inno Setup/license.txt`](Inno%20Setup/license.txt).
