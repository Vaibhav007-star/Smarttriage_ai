# 🏥 SmartTriage AI — Predictive ICU Risk Engine & Clinical Briefing

An enterprise-grade Emergency Room (ER) decision-support system that predicts **ICU admission risk** from early vital signs and generates **automated clinical briefings**.

---

## ⚡ Quick Start

### 1. Launch the Interactive Dashboard
Run either of the following commands from this folder:
```powershell
.\run_dashboard.bat
# or
streamlit run app.py
```
Open **[http://localhost:8501](http://localhost:8501)** in your browser.

### 2. Retrain the Model with GPU Acceleration
```powershell
.\train_model.bat
# or
python train.py
```

---

## 🚀 GPU Acceleration Setup

- **Detected GPU**: NVIDIA GeForce RTX 3050 Laptop GPU (6 GB VRAM)
- **CUDA Support**: CUDA 12.9 / 13.3 UMD
- **Engine**: XGBoost 3.3.0 GPU-accelerated histogram algorithm (`tree_method='hist'`, `device='cuda'`)
- **Benefit**: Rapid multi-fold cross-validation and hyperparameter evaluation in ~2 seconds, with seamless CPU-portable inference for web serving.

---

## 📊 Dataset Evaluation & Best Representation

### Comparison of Datasets:
| Dataset Representation | Source | Records | Notes & Limitations |
| :--- | :--- | :--- | :--- |
| **Legacy `clinical_patients.csv`** | Previous script export | 384 | ❌ Target-leakage during missing-value imputation (`clean[col].fillna(median_by_ICU)`). Dropped `Temperature`. Missed patient trajectory data. (ROC-AUC ~0.74) |
| **Raw Kaggle Excel (`archive.zip`)** | Hospital Sírio-Libanês COVID-19 ICU Dataset | 1,925 rows across 5 time windows | Contains 231 lab biomarkers (arterial blood gases, chemistry) not available at early ER arrival. |
| **⭐ Enhanced Leakage-Free Clinical Triage Dataset** *(Selected as Best)* | Synthesized from raw Sírio-Libanês dataset via updated `data_processor.py` | 384 complete patient presentation visits | **✅ Zero missing values**, zero data leakage, preserves multi-window patient trajectories prior to ICU admission, includes all 7 vital signs + **Shock Index** + **MAP** + **Pulse Pressure**. |

### Why This Representation Is the Best Choice:
1. **Zero Data Leakage**: Eliminates target-conditioned median imputation.
2. **Clinical Authenticity**: Focuses on bedside vitals accessible by emergency nurses within 2 minutes of triage.
3. **Hemodynamic Biomarkers**: Derives critical care indicators:
   - **Shock Index (HR / SBP)**: Critical occult shock predictor ($\ge 0.9$).
   - **Mean Arterial Pressure (MAP)**: Systemic hypoperfusion indicator ($< 65\text{ mmHg}$).
   - **Pulse Pressure (SBP - DBP)**: Indicator of vascular tone and stroke volume.
4. **Model Performance**:
   - **ROC-AUC**: Improved from **0.7422 → 0.8016** (+6.0%)
   - **Test Accuracy**: Improved from **66.2% → 72.7%** (+6.5%)
   - **Precision**: Improved from **65.8% → 75.0%** (+9.2%)

---

## 🛠️ Errors Fixed in This Update

1. **`FileNotFoundError: /tmp/sirio_data/...`**:
   - Fixed hardcoded Linux temporary path in `data_processor.py`. Added automatic discovery of `Kaggle_Sirio_Libanes_ICU_Prediction.xlsx` and `archive.zip`.
2. **`UnicodeEncodeError: 'charmap' codec can't encode character ...`**:
   - Fixed Windows console CP1252 character crash on emojis, arrows, and degree symbols across all modules with automatic UTF-8 reconfiguration.
3. **Data Leakage in Dataset Preprocessing**:
   - Replaced target-leaking imputation with multi-window patient trajectory forward/backward fill.
4. **Missing Temperature Feature**:
   - Aligned `Temperature` across data processing, model training (`FEATURE_COLUMNS`), and the Streamlit dashboard (`FEATURE_ORDER`).
5. **CPU-only Training to GPU Acceleration**:
   - Enabled native NVIDIA CUDA acceleration for XGBoost training (`device='cuda'`, `tree_method='hist'`).
6. **Windows PATH & Launcher Ergonomics**:
   - Added Python 3.12 and Scripts to user environment PATH. Created root launchers `app.py`, `train.py`, `run_dashboard.bat`, and `train_model.bat`.

---

## 📁 Project Structure

```text
c:\Projects\smarttriage_ai\
├── app.py                      # Root Streamlit launcher
├── train.py                    # Root GPU training launcher
├── run_dashboard.bat           # 1-Click Windows dashboard launcher
├── train_model.bat             # 1-Click Windows GPU model trainer
├── requirements.txt            # Python dependencies
├── README.md                   # System documentation
└── smarttriage_ai\             # Core application package
    ├── app.py                  # Streamlit dashboard & UI
    ├── data_processor.py       # Clinical dataset processor
    ├── model_trainer.py        # GPU-accelerated XGBoost training pipeline
    ├── summarizer.py           # GenAI & clinical rule-based summarizer
    ├── archive.zip             # Raw Kaggle Hospital Sírio-Libanês dataset
    ├── data\
    │   ├── clinical_patients.csv
    │   └── Kaggle_Sirio_Libanes_ICU_Prediction.xlsx
    └── models\
        ├── icu_risk_model.pkl
        └── evaluation_report.txt
```

