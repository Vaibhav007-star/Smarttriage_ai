"""
SmartTriage AI — Step 2: Predictive Modeling Pipeline
=====================================================
Trains an XGBoost classifier with GPU acceleration (NVIDIA CUDA) on the
processed clinical dataset to predict ICU admission risk.

Saves a complete Scikit-Learn Pipeline (Feature Engineering + Scaler + Model)
as a joblib artifact for use by the Streamlit dashboard.

Outputs:
  - models/icu_risk_model.pkl
  - models/evaluation_report.txt
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# ---------------------------------------------------------------------------
# Windows UTF-8 console output protection
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("model_trainer")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent
DATA_PATH = PROJECT_ROOT / "data" / "clinical_patients.csv"
MODEL_DIR = PROJECT_ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODEL_DIR / "icu_risk_model.pkl"
REPORT_PATH = MODEL_DIR / "evaluation_report.txt"

# Core 7 clinical bedside inputs collected at emergency triage
FEATURE_COLUMNS = [
    "Age",
    "Heart_Rate",
    "Systolic_BP",
    "Diastolic_BP",
    "Respiratory_Rate",
    "Oxygen_Saturation",
    "Temperature",
]
TARGET_COLUMN = "Requires_ICU"


# ---------------------------------------------------------------------------
# GPU Detection Helper
# ---------------------------------------------------------------------------
def detect_gpu_device() -> str:
    """Detect if NVIDIA GPU CUDA acceleration is available for XGBoost."""
    try:
        import xgboost as xgb

        test_clf = xgb.XGBClassifier(n_estimators=1, tree_method="hist", device="cuda")
        test_clf.fit(np.array([[1.0, 2.0], [3.0, 4.0]]), np.array([0, 1]))
        logger.info("NVIDIA GPU detected and verified for XGBoost (device='cuda').")
        return "cuda"
    except Exception as exc:
        logger.warning("GPU not available for XGBoost (%s). Falling back to CPU.", exc)
        return "cpu"


# ---------------------------------------------------------------------------
# Clinical Feature Engineering Transformer
# ---------------------------------------------------------------------------
class TriageFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Computes evidence-based emergency triage biomarkers from standard vitals:
      - Shock Index (SI) = Heart Rate / Systolic BP (critical shock marker > 0.9)
      - Mean Arterial Pressure (MAP) = DBP + (SBP - DBP)/3 (hypoperfusion marker < 65)
      - Pulse Pressure (PP) = SBP - DBP
      - Clinical Threshold Flags (hypoxemia, tachycardia, tachypnea)
    """

    def __init__(self) -> None:
        pass

    def fit(self, X: Any, y: Any = None) -> "TriageFeatureEngineer":
        return self

    def transform(self, X: Any) -> np.ndarray:
        if isinstance(X, pd.DataFrame):
            df = X.copy()
        else:
            df = pd.DataFrame(X, columns=FEATURE_COLUMNS)

        age = df["Age"].astype(float)
        hr = df["Heart_Rate"].astype(float)
        sbp = df["Systolic_BP"].astype(float)
        dbp = df["Diastolic_BP"].astype(float)
        rr = df["Respiratory_Rate"].astype(float)
        spo2 = df["Oxygen_Saturation"].astype(float)
        temp = df["Temperature"].astype(float)

        # Derived biomarkers
        shock_index = hr / (sbp + 1e-5)
        map_val = dbp + (sbp - dbp) / 3.0
        pulse_pressure = sbp - dbp

        # Critical threshold indicators
        flag_hypoxemia = (spo2 < 94.0).astype(float)
        flag_tachycardia = (hr > 100.0).astype(float)
        flag_tachypnea = (rr > 22.0).astype(float)
        flag_elderly = (age >= 65.0).astype(float)

        engineered = np.column_stack(
            [
                age,
                hr,
                sbp,
                dbp,
                rr,
                spo2,
                temp,
                shock_index,
                map_val,
                pulse_pressure,
                flag_hypoxemia,
                flag_tachycardia,
                flag_tachypnea,
                flag_elderly,
            ]
        )
        return engineered


def load_data(path: Path = DATA_PATH) -> Tuple[pd.DataFrame, pd.Series]:
    """Load processed CSV and return X, y."""
    if not path.exists():
        raise FileNotFoundError(
            f"Processed dataset not found at {path}. "
            "Run data_processor.py first."
        )
    df = pd.read_csv(path)
    logger.info("Loaded %d records from %s", len(df), path)

    missing_cols = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required feature columns: {missing_cols}")

    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].astype(int)
    return X, y


def build_pipeline(device: str = "cuda") -> Pipeline:
    """
    Create a reusable Scikit-Learn Pipeline:
      TriageFeatureEngineer -> StandardScaler -> XGBClassifier (GPU accelerated)
    """
    model = XGBClassifier(
        n_estimators=220,
        max_depth=3,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=2.0,
        reg_alpha=0.5,
        scale_pos_weight=1.0,
        random_state=42,
        eval_metric="logloss",
        tree_method="hist",
        device=device,
    )
    pipeline = Pipeline(
        steps=[
            ("features", TriageFeatureEngineer()),
            ("scaler", StandardScaler()),
            ("classifier", model),
        ]
    )
    return pipeline


def evaluate(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
) -> Dict[str, Any]:
    """Compute and return a full evaluation dictionary."""
    cm = confusion_matrix(y_true, y_pred)
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_proba) if len(np.unique(y_true)) > 1 else float("nan"),
        "confusion_matrix": cm,
        "classification_report": classification_report(
            y_true, y_pred, target_names=["No ICU", "Requires ICU"], zero_division=0
        ),
    }
    return metrics


def print_and_save_report(
    metrics: Dict[str, Any],
    cv_mean: float,
    cv_std: float,
    device_used: str,
    path: Path = REPORT_PATH,
) -> None:
    """Pretty-print evaluation and persist to disk (ASCII-safe)."""
    lines = [
        "=" * 60,
        "SmartTriage AI - ICU Risk Model Evaluation Report",
        "=" * 60,
        f"Training Device      : {device_used.upper()} (GPU Acceleration)",
        f"5-Fold CV ROC-AUC    : {cv_mean:.4f} (+/- {cv_std:.4f})",
        "-" * 60,
        f"Test Accuracy        : {metrics['accuracy']:.4f}",
        f"Test Precision       : {metrics['precision']:.4f}",
        f"Test Recall          : {metrics['recall']:.4f}",
        f"Test F1-Score        : {metrics['f1']:.4f}",
        f"Test ROC-AUC         : {metrics['roc_auc']:.4f}",
        "",
        "Confusion Matrix (Test Set):",
        "                 Predicted",
        "               No ICU  ICU",
        f"Actual No ICU   {metrics['confusion_matrix'][0,0]:5d}  {metrics['confusion_matrix'][0,1]:5d}",
        f"       ICU      {metrics['confusion_matrix'][1,0]:5d}  {metrics['confusion_matrix'][1,1]:5d}",
        "",
        "Classification Report:",
        metrics["classification_report"],
        "=" * 60,
    ]
    report = "\n".join(lines)
    print(report)

    path.write_text(report, encoding="utf-8")
    logger.info("Evaluation report saved -> %s", path)


def train_and_save(
    test_size: float = 0.20,
    random_state: int = 42,
) -> Pipeline:
    """Full training workflow with GPU acceleration."""
    X, y = load_data()

    device = detect_gpu_device()
    logger.info("Initializing GPU training pipeline with device='%s' ...", device)

    # 5-Fold Stratified Cross-Validation
    cv_pipeline = build_pipeline(device=device)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    logger.info("Running 5-fold Stratified Cross-Validation on GPU ...")
    cv_scores = cross_val_score(cv_pipeline, X, y, cv=cv, scoring="roc_auc")
    cv_mean = float(np.mean(cv_scores))
    cv_std = float(np.std(cv_scores))
    logger.info("5-Fold CV ROC-AUC: %.4f (+/- %.4f)", cv_mean, cv_std)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    logger.info(
        "Train size: %d | Test size: %d | Positive rate (train): %.1f%%",
        len(X_train),
        len(X_test),
        y_train.mean() * 100,
    )

    pipeline = build_pipeline(device=device)
    logger.info("Fitting final pipeline on GPU ...")
    pipeline.fit(X_train, y_train)

    # Make test predictions (ensure portable device compatibility)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = evaluate(y_test.values, y_pred, y_proba)
    print_and_save_report(metrics, cv_mean, cv_std, device)

    # For deployment inference portability in Streamlit (CPU inputs),
    # set the classifier device to CPU so single-patient web queries
    # evaluate instantly without GPU context switches or DMatrix warnings.
    pipeline.named_steps["classifier"].set_params(device="cpu")

    # Persist the full pipeline (feature engineer + scaler + model)
    joblib.dump(pipeline, MODEL_PATH)
    logger.info("Model pipeline saved -> %s", MODEL_PATH)

    return pipeline


def main() -> None:
    try:
        train_and_save()
        print("\n[OK] Step 2 complete. GPU-trained ICU risk model ready for deployment.")
        print(f"   Model artifact : {MODEL_PATH}")
        print(f"   Report         : {REPORT_PATH}")
    except Exception as exc:
        logger.exception("Training failed")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
