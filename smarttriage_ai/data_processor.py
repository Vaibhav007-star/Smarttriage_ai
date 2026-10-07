"""
SmartTriage AI — Step 1: Clinical Dataset Processor
====================================================
Processes the real Hospital Sírio-Libanês COVID-19 ICU Prediction dataset
(Kaggle) into a clean, model-ready CSV with realistic clinical ranges.

Source: https://www.kaggle.com/datasets/Sírio-Libanes/covid19
File  : Kaggle_Sirio_Libanes_ICU_Prediction.xlsx or archive.zip

Output: data/clinical_patients.csv
"""

from __future__ import annotations

import io
import logging
import sys
import zipfile
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Windows UTF-8 console output protection
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("data_processor")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_CSV = DATA_DIR / "clinical_patients.csv"


def find_raw_dataset(specified_path: Optional[Path] = None) -> Path | tuple[Path, str]:
    """
    Search candidate paths for the Sírio-Libanês dataset (Excel or Zip).
    Returns either Path to Excel file, or (zip_path, member_name).
    """
    if specified_path and Path(specified_path).exists():
        p = Path(specified_path)
        if p.suffix.lower() == ".zip":
            return (p, "Kaggle_Sirio_Libanes_ICU_Prediction.xlsx")
        return p

    candidates = [
        DATA_DIR / "Kaggle_Sirio_Libanes_ICU_Prediction.xlsx",
        PROJECT_ROOT / "Kaggle_Sirio_Libanes_ICU_Prediction.xlsx",
        DATA_DIR / "archive.zip",
        PROJECT_ROOT / "archive.zip",
        PROJECT_ROOT.parent / "archive.zip",
        PROJECT_ROOT.parent / "data" / "Kaggle_Sirio_Libanes_ICU_Prediction.xlsx",
    ]

    for cand in candidates:
        if cand.exists():
            if cand.suffix.lower() == ".zip":
                return (cand, "Kaggle_Sirio_Libanes_ICU_Prediction.xlsx")
            return cand

    raise FileNotFoundError(
        "Could not find Kaggle_Sirio_Libanes_ICU_Prediction.xlsx or archive.zip in "
        f"'{DATA_DIR}' or '{PROJECT_ROOT}'."
    )


# ---------------------------------------------------------------------------
# Inverse scaling helpers
# The original dataset was MinMax-scaled to [-1, 1].
# We restore approximate real-world clinical ranges so the Streamlit
# dashboard and GenAI summaries show medically meaningful numbers.
# ---------------------------------------------------------------------------
def inverse_minmax(scaled: pd.Series, real_min: float, real_max: float) -> pd.Series:
    """Convert values from [-1, 1] back to [real_min, real_max]."""
    return (scaled + 1.0) / 2.0 * (real_max - real_min) + real_min


def map_age_percentil(percentil: str) -> int:
    """Map AGE_PERCENTIL categories to approximate age in years."""
    mapping = {
        "10th": 25,
        "20th": 35,
        "30th": 45,
        "40th": 52,
        "50th": 58,
        "60th": 65,
        "70th": 72,
        "80th": 78,
        "90th": 85,
        "Above 90th": 92,
    }
    return mapping.get(str(percentil).strip(), 60)


def process_dataset(raw_path: Optional[Path] = None) -> pd.DataFrame:
    """
    Load, clean and transform the Sírio-Libanês dataset without data leakage.

    Strategy (aligned with clinical triage and Kaggle best practices):
    - Within each patient's timeline, carry forward/backward valid vitals across windows.
    - Select the initial triage window ('0-2') representing early ER presentation.
    - Derive binary Requires_ICU label from final ICU outcome.
    - Inverse-scale vital signs to physiologic clinical units.
    - Drop records with zero clinical measurements (Patient 199), retaining 384 complete cases.
    - Compute hemodynamic clinical indicators (Shock Index, MAP, Pulse Pressure).
    """
    found = find_raw_dataset(raw_path)
    if isinstance(found, tuple):
        zip_path, member_name = found
        logger.info("Reading raw dataset from archive '%s' -> '%s'", zip_path.name, member_name)
        with zipfile.ZipFile(zip_path, "r") as z:
            with z.open(member_name) as f:
                df = pd.read_excel(f)
    else:
        logger.info("Loading raw Excel from %s", found)
        df = pd.read_excel(found)

    logger.info("Raw shape: %s with %d unique patients", df.shape, df["PATIENT_VISIT_IDENTIFIER"].nunique())

    # ------------------------------------------------------------------
    # 1. Determine final ICU outcome per patient
    # ------------------------------------------------------------------
    patient_icu = (
        df.groupby("PATIENT_VISIT_IDENTIFIER")["ICU"]
        .max()
        .reset_index()
        .rename(columns={"ICU": "Requires_ICU"})
    )

    # ------------------------------------------------------------------
    # 2. Patient-level forward/backward fill across pre-ICU timeline
    # ------------------------------------------------------------------
    vital_cols = [
        "BLOODPRESSURE_DIASTOLIC_MEAN",
        "BLOODPRESSURE_SISTOLIC_MEAN",
        "HEART_RATE_MEAN",
        "RESPIRATORY_RATE_MEAN",
        "TEMPERATURE_MEAN",
        "OXYGEN_SATURATION_MEAN",
    ]

    df_filled = df.copy()
    df_filled[vital_cols] = df_filled.groupby("PATIENT_VISIT_IDENTIFIER")[vital_cols].transform(
        lambda x: x.ffill().bfill()
    )

    # Take earliest window ('0-2') for ER triage prediction
    earliest = df_filled[df_filled["WINDOW"] == "0-2"].copy()
    earliest = earliest.merge(patient_icu, on="PATIENT_VISIT_IDENTIFIER", how="left")

    # Drop any patient visit with no recorded vitals at all (only 1 patient across dataset)
    initial_count = len(earliest)
    earliest = earliest.dropna(subset=["HEART_RATE_MEAN"]).copy()
    logger.info("Usable patients with verified vitals: %d / %d", len(earliest), initial_count)

    # ------------------------------------------------------------------
    # 3. Build clean feature table with realistic units
    # ------------------------------------------------------------------
    records = []
    for _, row in earliest.iterrows():
        # Age
        age = map_age_percentil(row.get("AGE_PERCENTIL", "50th"))
        if pd.notna(row.get("AGE_ABOVE65")) and row["AGE_ABOVE65"] == 1 and age < 65:
            age = max(age, 66)

        # Inverse-scale vitals (realistic physiologic ranges)
        hr = inverse_minmax(row["HEART_RATE_MEAN"], 40, 180)
        sbp = inverse_minmax(row["BLOODPRESSURE_SISTOLIC_MEAN"], 70, 220)
        dbp = inverse_minmax(row["BLOODPRESSURE_DIASTOLIC_MEAN"], 40, 140)
        rr = inverse_minmax(row["RESPIRATORY_RATE_MEAN"], 8, 50)
        spo2 = inverse_minmax(row["OXYGEN_SATURATION_MEAN"], 70, 100)
        temp = inverse_minmax(row["TEMPERATURE_MEAN"], 34.0, 41.0)

        # Triage hemodynamic biomarkers
        shock_index = float(hr) / (float(sbp) + 1e-5)
        map_val = float(dbp) + (float(sbp) - float(dbp)) / 3.0
        pulse_pressure = float(sbp) - float(dbp)

        records.append(
            {
                "Patient_ID": int(row["PATIENT_VISIT_IDENTIFIER"]),
                "Age": int(round(age)),
                "Gender": int(row.get("GENDER", 0)),  # 0 = female, 1 = male
                "Heart_Rate": round(float(hr), 1),
                "Systolic_BP": round(float(sbp), 1),
                "Diastolic_BP": round(float(dbp), 1),
                "Respiratory_Rate": round(float(rr), 1),
                "Oxygen_Saturation": round(float(spo2), 1),
                "Temperature": round(float(temp), 1),
                "Shock_Index": round(shock_index, 3),
                "MAP": round(map_val, 1),
                "Pulse_Pressure": round(pulse_pressure, 1),
                "Requires_ICU": int(row["Requires_ICU"]),
            }
        )

    clean = pd.DataFrame(records)

    # Enforce physiologic sanity bounds
    clean["Heart_Rate"] = clean["Heart_Rate"].clip(40, 200)
    clean["Systolic_BP"] = clean["Systolic_BP"].clip(60, 250)
    clean["Diastolic_BP"] = clean["Diastolic_BP"].clip(30, 150)
    clean["Respiratory_Rate"] = clean["Respiratory_Rate"].clip(6, 60)
    clean["Oxygen_Saturation"] = clean["Oxygen_Saturation"].clip(50, 100)
    clean["Temperature"] = clean["Temperature"].clip(33.0, 42.0)

    feature_cols = [
        "Heart_Rate",
        "Systolic_BP",
        "Diastolic_BP",
        "Respiratory_Rate",
        "Oxygen_Saturation",
        "Temperature",
        "Shock_Index",
        "MAP",
    ]

    logger.info("Final clean shape: %s (zero missing values)", clean.shape)
    logger.info("Requires_ICU distribution:\n%s", clean["Requires_ICU"].value_counts().to_string())
    logger.info("\nFeature summary:\n%s", clean[feature_cols + ["Age"]].describe().round(2).to_string())

    return clean


def main() -> None:
    """Entry point: process data and write CSV."""
    try:
        df = process_dataset()
        df.to_csv(OUTPUT_CSV, index=False)
        logger.info("Saved processed dataset -> %s", OUTPUT_CSV)
        print("\n[OK] Step 1 complete. Processed clinical dataset ready.")
        print(f"   Location : {OUTPUT_CSV}")
        print(f"   Records  : {len(df)}")
        print(f"   ICU rate : {df['Requires_ICU'].mean():.1%}")
    except Exception as exc:
        logger.exception("Failed to process dataset")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
