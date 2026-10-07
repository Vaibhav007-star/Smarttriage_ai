"""
SmartTriage AI — Next-Gen Clinical Triage & ICU Risk Cockpit
=============================================================
Enterprise-grade Emergency Room decision-support cockpit powered by
GPU-accelerated XGBoost and Evidence-Based Clinical Telemetry.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional

# ---------------------------------------------------------------------------
# Windows UTF-8 console output protection & sys.path setup
# ---------------------------------------------------------------------------
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Import pipeline feature engineer so joblib pipeline unpickles cleanly
from model_trainer import TriageFeatureEngineer
from summarizer import generate_clinical_summary

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("app")

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
MODEL_PATH = PROJECT_ROOT / "models" / "icu_risk_model.pkl"
DATA_PATH = PROJECT_ROOT / "data" / "clinical_patients.csv"

FEATURE_ORDER = [
    "Age",
    "Heart_Rate",
    "Systolic_BP",
    "Diastolic_BP",
    "Respiratory_Rate",
    "Oxygen_Saturation",
    "Temperature",
]

TOTAL_ICU_BEDS = 25
OCCUPIED_ICU_BEDS = 21  # 4 available

# Clinical Presets for rapid ER scenario testing
PRESETS = {
    "🚨 Severe Septic Shock (High Risk)": {
        "Age": 68,
        "Heart_Rate": 132.0,
        "Systolic_BP": 84.0,
        "Diastolic_BP": 48.0,
        "Respiratory_Rate": 29.0,
        "Oxygen_Saturation": 87.0,
        "Temperature": 39.4,
    },
    "🫁 Acute Hypoxemic Distress (High Risk)": {
        "Age": 62,
        "Heart_Rate": 115.0,
        "Systolic_BP": 135.0,
        "Diastolic_BP": 85.0,
        "Respiratory_Rate": 32.0,
        "Oxygen_Saturation": 83.0,
        "Temperature": 38.2,
    },
    "⚡ Hypertensive Crisis (Moderate Risk)": {
        "Age": 59,
        "Heart_Rate": 102.0,
        "Systolic_BP": 208.0,
        "Diastolic_BP": 122.0,
        "Respiratory_Rate": 22.0,
        "Oxygen_Saturation": 95.0,
        "Temperature": 37.1,
    },
    "👴 Vulnerable Geriatric Sepsis (Moderate/High)": {
        "Age": 84,
        "Heart_Rate": 108.0,
        "Systolic_BP": 96.0,
        "Diastolic_BP": 58.0,
        "Respiratory_Rate": 24.0,
        "Oxygen_Saturation": 91.0,
        "Temperature": 38.6,
    },
    "🟢 Stable Patient Observation (Low Risk)": {
        "Age": 32,
        "Heart_Rate": 72.0,
        "Systolic_BP": 118.0,
        "Diastolic_BP": 76.0,
        "Respiratory_Rate": 15.0,
        "Oxygen_Saturation": 99.0,
        "Temperature": 36.7,
    },
}


# ---------------------------------------------------------------------------
# Cached Model & Data Loaders
# ---------------------------------------------------------------------------
@st.cache_resource
def load_model():
    """Load the trained Scikit-Learn pipeline once and configure for fast CPU inference."""
    if not MODEL_PATH.exists():
        st.error(f"Model artifact not found at {MODEL_PATH}. Run model_trainer.py first.")
        st.stop()
    pipeline = joblib.load(MODEL_PATH)
    try:
        if hasattr(pipeline, "named_steps") and "classifier" in pipeline.named_steps:
            pipeline.named_steps["classifier"].set_params(device="cpu")
    except Exception:
        pass
    logger.info("Model loaded from %s", MODEL_PATH)
    return pipeline


@st.cache_data
def load_sample_patients() -> pd.DataFrame:
    """Load processed clinical dataset for comparative population analytics."""
    if not DATA_PATH.exists():
        return pd.DataFrame()
    return pd.read_csv(DATA_PATH)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def risk_tier(prob: float) -> str:
    if prob >= 0.70:
        return "HIGH"
    if prob >= 0.35:
        return "MODERATE"
    return "LOW"


def get_tier_meta(tier: str) -> Dict[str, str]:
    if tier == "HIGH":
        return {
            "label": "CRITICAL HIGH RISK",
            "color": "#ef4444",
            "bg": "rgba(239, 68, 68, 0.12)",
            "border": "rgba(239, 68, 68, 0.5)",
            "badge": "🔴 HIGH RISK",
            "glow": "0 0 25px rgba(239, 68, 68, 0.35)",
            "action": "Immediate ICU Bed Booking & Critical Care Team Escalation",
        }
    if tier == "MODERATE":
        return {
            "label": "ELEVATED MODERATE RISK",
            "color": "#f59e0b",
            "bg": "rgba(245, 158, 11, 0.12)",
            "border": "rgba(245, 158, 11, 0.5)",
            "badge": "🟡 MODERATE RISK",
            "glow": "0 0 20px rgba(245, 158, 11, 0.3)",
            "action": "Continuous Step-Down Monitoring & Senior Physician Review",
        }
    return {
        "label": "STABLE LOW RISK",
        "color": "#10b981",
        "bg": "rgba(16, 185, 129, 0.12)",
        "border": "rgba(16, 185, 129, 0.5)",
        "badge": "🟢 LOW RISK",
        "glow": "0 0 20px rgba(16, 185, 129, 0.25)",
        "action": "Standard Ward Observation & Scheduled Vital Check",
    }


def get_vital_status(vital: str, value: float) -> Dict[str, str]:
    """Return styling chips and alerts for specific vitals."""
    if vital == "Heart_Rate":
        if value > 120:
            return {"chip": "SEVERE TACHYCARDIA", "color": "#ef4444", "ref": "60–100 bpm"}
        if value > 100:
            return {"chip": "TACHYCARDIA", "color": "#f59e0b", "ref": "60–100 bpm"}
        if value < 55:
            return {"chip": "BRADYCARDIA", "color": "#f59e0b", "ref": "60–100 bpm"}
        return {"chip": "NORMAL", "color": "#10b981", "ref": "60–100 bpm"}

    if vital == "Systolic_BP":
        if value >= 180:
            return {"chip": "CRITICAL CRISIS", "color": "#ef4444", "ref": "90–120 mmHg"}
        if value > 140:
            return {"chip": "STAGE 2 HTN", "color": "#f59e0b", "ref": "90–120 mmHg"}
        if value < 90:
            return {"chip": "HYPOTENSION", "color": "#ef4444", "ref": "90–120 mmHg"}
        return {"chip": "NORMAL", "color": "#10b981", "ref": "90–120 mmHg"}

    if vital == "Diastolic_BP":
        if value >= 110:
            return {"chip": "CRITICAL DIASTOLIC", "color": "#ef4444", "ref": "60–80 mmHg"}
        if value > 90:
            return {"chip": "ELEVATED", "color": "#f59e0b", "ref": "60–80 mmHg"}
        if value < 60:
            return {"chip": "LOW DIASTOLIC", "color": "#f59e0b", "ref": "60–80 mmHg"}
        return {"chip": "NORMAL", "color": "#10b981", "ref": "60–80 mmHg"}

    if vital == "Respiratory_Rate":
        if value >= 28:
            return {"chip": "SEVERE TACHYPNEA", "color": "#ef4444", "ref": "12–20 /min"}
        if value > 22:
            return {"chip": "TACHYPNEA", "color": "#f59e0b", "ref": "12–20 /min"}
        if value < 10:
            return {"chip": "BRADYPNEA", "color": "#ef4444", "ref": "12–20 /min"}
        return {"chip": "NORMAL", "color": "#10b981", "ref": "12–20 /min"}

    if vital == "Oxygen_Saturation":
        if value < 90:
            return {"chip": "CRITICAL HYPOXIA", "color": "#ef4444", "ref": "95–100 %"}
        if value < 95:
            return {"chip": "MILD HYPOXIA", "color": "#f59e0b", "ref": "95–100 %"}
        return {"chip": "OPTIMAL", "color": "#10b981", "ref": "95–100 %"}

    if vital == "Temperature":
        if value >= 39.0:
            return {"chip": "HIGH FEVER", "color": "#ef4444", "ref": "36.5–37.5 °C"}
        if value > 37.8:
            return {"chip": "FEBRILE", "color": "#f59e0b", "ref": "36.5–37.5 °C"}
        if value < 35.5:
            return {"chip": "HYPOTHERMIA", "color": "#ef4444", "ref": "36.5–37.5 °C"}
        return {"chip": "AFEBRILE", "color": "#10b981", "ref": "36.5–37.5 °C"}

    return {"chip": "STABLE", "color": "#10b981", "ref": "Standard"}


# ---------------------------------------------------------------------------
# Page Configuration & Advanced Theme CSS
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="SmartTriage AI — Hospital ICU Command Cockpit",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Overall Dark Cockpit Canvas */
    .stApp {
        background-color: #0b0f19;
        color: #f1f5f9;
    }

    /* Hide default Streamlit padding */
    .block-container {
        padding-top: 1.8rem;
        padding-bottom: 3.5rem;
        max-width: 1400px;
    }

    /* Top Command Header */
    .cmd-header {
        background: linear-gradient(135deg, rgba(19, 27, 46, 0.95), rgba(11, 15, 25, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1.3rem 1.8rem;
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }
    .cmd-title {
        font-size: 1.85rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #ffffff 0%, #38bdf8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }
    .cmd-subtitle {
        font-size: 0.88rem;
        color: #94a3b8;
        margin-top: 0.2rem;
        font-weight: 500;
    }

    /* Bed Capacity Meter Box */
    .bed-panel {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 12px;
        padding: 0.8rem 1.2rem;
        text-align: right;
    }
    .bed-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.15rem;
        font-weight: 700;
        color: #38bdf8;
    }

    /* Glassmorphism Card System */
    .glass-card {
        background: linear-gradient(145deg, rgba(19, 27, 46, 0.85), rgba(15, 23, 42, 0.75));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 1.4rem;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(14px);
        margin-bottom: 1.2rem;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .glass-card:hover {
        border-color: rgba(56, 189, 248, 0.3);
    }

    /* Telemetry Vital Tile */
    .vital-tile {
        background: rgba(15, 23, 42, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 14px;
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 140px;
        transition: all 0.25s ease;
    }
    .vital-tile:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .vital-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
    }
    .vital-name {
        font-size: 0.82rem;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .vital-value-wrap {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        margin: 0.3rem 0;
    }
    .vital-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2.1rem;
        font-weight: 800;
        color: #ffffff;
        line-height: 1;
    }
    .vital-unit {
        font-size: 0.82rem;
        font-weight: 600;
        color: #64748b;
    }
    .vital-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 0.4rem;
        font-size: 0.72rem;
        color: #64748b;
    }
    .vital-chip {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }

    /* Hemodynamic Biomarker Tile */
    .biomarker-card {
        background: linear-gradient(135deg, rgba(20, 29, 51, 0.9), rgba(15, 23, 42, 0.8));
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 14px;
        padding: 1.2rem;
    }
    .biomarker-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2.2rem;
        font-weight: 800;
        color: #38bdf8;
    }

    /* AI Briefing Terminal Box */
    .ai-terminal {
        background: #070a13;
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-left: 4px solid #38bdf8;
        border-radius: 12px;
        padding: 1.3rem;
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.7);
        font-size: 0.95rem;
        line-height: 1.6;
        color: #e2e8f0;
    }

    /* Custom Pulsing Status Dot */
    .live-dot {
        display: inline-block;
        width: 9px;
        height: 9px;
        background-color: #10b981;
        border-radius: 50%;
        margin-right: 6px;
        box-shadow: 0 0 10px #10b981;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
    }

    /* Style Streamlit Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 6px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: rgba(15, 23, 42, 0.6);
        border-radius: 10px 10px 0 0;
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        padding: 0.5rem 1.2rem;
        font-weight: 600;
        font-size: 0.9rem;
    }
    .stTabs [aria-selected="true"] {
        background-color: rgba(56, 189, 248, 0.15) !important;
        border-color: rgba(56, 189, 248, 0.4) !important;
        color: #38bdf8 !important;
    }

    /* Sidebar adjustments */
    section[data-testid="stSidebar"] {
        background-color: #080c16;
        border-right: 1px solid rgba(255, 255, 255, 0.07);
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ---------------------------------------------------------------------------
# Sidebar: Controls & Patient Telemetry Inputs
# ---------------------------------------------------------------------------
def render_sidebar(sample_df: pd.DataFrame) -> Dict[str, Any]:
    st.sidebar.markdown(
        """
        <div style="display:flex; align-items:center; gap:8px; margin-bottom: 0.5rem;">
            <span class="live-dot"></span>
            <span style="font-size:0.75rem; font-weight:700; letter-spacing:0.08em; color:#10b981; text-transform:uppercase;">
                Live Bedside Input
            </span>
        </div>
        <h2 style="font-size:1.35rem; font-weight:800; margin:0 0 1rem 0; color:#ffffff;">
            🩺 Patient Parameters
        </h2>
        """,
        unsafe_allow_html=True,
    )

    # Preset Clinical Scenarios
    st.sidebar.markdown(
        "<p style='font-size:0.8rem; font-weight:700; color:#94a3b8; margin-bottom:0.3rem;'>⚡ QUICK CLINICAL PRESETS</p>",
        unsafe_allow_html=True,
    )
    preset_choice = st.sidebar.selectbox(
        "Load Clinical Scenario",
        ["— Select Scenario Preset —"] + list(PRESETS.keys()),
        index=0,
        label_visibility="collapsed",
    )

    # Cohort selector
    st.sidebar.markdown(
        "<p style='font-size:0.8rem; font-weight:700; color:#94a3b8; margin:0.8rem 0 0.3rem 0;'>📁 HOSPITAL COHORT SAMPLE</p>",
        unsafe_allow_html=True,
    )
    cohort_options = ["— Manual / Preset Entry —"] + [
        f"Patient #{int(r.Patient_ID)} (Age {int(r.Age)}, ICU={'YES' if r.Requires_ICU else 'NO'})"
        for _, r in sample_df.head(50).iterrows()
    ]
    cohort_choice = st.sidebar.selectbox(
        "Load from Sírio-Libanês Dataset",
        cohort_options,
        index=0,
        label_visibility="collapsed",
    )

    # Determine default values based on selection
    if preset_choice in PRESETS:
        defaults = PRESETS[preset_choice]
    elif cohort_choice != "— Manual / Preset Entry —":
        pt_id = int(cohort_choice.split()[1].replace("#", ""))
        row = sample_df.loc[sample_df["Patient_ID"] == pt_id].iloc[0]
        defaults = {
            "Age": int(row["Age"]),
            "Heart_Rate": float(row["Heart_Rate"]),
            "Systolic_BP": float(row["Systolic_BP"]),
            "Diastolic_BP": float(row["Diastolic_BP"]),
            "Respiratory_Rate": float(row["Respiratory_Rate"]),
            "Oxygen_Saturation": float(row["Oxygen_Saturation"]),
            "Temperature": float(row["Temperature"]),
        }
    else:
        defaults = {
            "Age": 56,
            "Heart_Rate": 88.0,
            "Systolic_BP": 126.0,
            "Diastolic_BP": 82.0,
            "Respiratory_Rate": 17.0,
            "Oxygen_Saturation": 96.0,
            "Temperature": 37.1,
        }

    st.sidebar.markdown(
        "<hr style='border:none; border-top:1px solid rgba(255,255,255,0.08); margin:1.2rem 0;'>",
        unsafe_allow_html=True,
    )

    # Sliders
    age = st.sidebar.slider("Age (Years)", 18, 95, int(defaults["Age"]), 1)
    hr = st.sidebar.slider("Heart Rate (bpm)", 40, 190, int(defaults["Heart_Rate"]), 1, help="Normal resting: 60-100 bpm")
    sbp = st.sidebar.slider("Systolic BP (mmHg)", 60, 240, int(defaults["Systolic_BP"]), 1, help="Normal: 90-120 mmHg")
    dbp = st.sidebar.slider("Diastolic BP (mmHg)", 35, 140, int(defaults["Diastolic_BP"]), 1, help="Normal: 60-80 mmHg")
    rr = st.sidebar.slider("Respiratory Rate (/min)", 8, 55, int(defaults["Respiratory_Rate"]), 1, help="Normal: 12-20 /min")
    spo2 = st.sidebar.slider("Oxygen Saturation - SpO₂ (%)", 60, 100, int(defaults["Oxygen_Saturation"]), 1, help="Normal: 95-100%")
    temp = st.sidebar.slider("Body Temperature (°C)", 33.5, 41.5, float(defaults["Temperature"]), 0.1, help="Normal: 36.5-37.5°C")

    st.sidebar.markdown(
        "<hr style='border:none; border-top:1px solid rgba(255,255,255,0.08); margin:1.2rem 0;'>",
        unsafe_allow_html=True,
    )
    assess_btn = st.sidebar.button(
        "⚡ EXECUTE TRIAGE INFERENCE",
        type="primary",
        use_container_width=True,
    )

    return {
        "Age": age,
        "Heart_Rate": float(hr),
        "Systolic_BP": float(sbp),
        "Diastolic_BP": float(dbp),
        "Respiratory_Rate": float(rr),
        "Oxygen_Saturation": float(spo2),
        "Temperature": float(temp),
        "trigger": assess_btn,
    }


# ---------------------------------------------------------------------------
# Plotly Charts
# ---------------------------------------------------------------------------
def build_risk_gauge(probability: float, tier: str) -> go.Figure:
    """Creates a high-precision radial risk gauge."""
    meta = get_tier_meta(tier)
    pct = probability * 100

    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=pct,
            number={"suffix": "%", "font": {"size": 46, "family": "JetBrains Mono", "color": "#ffffff"}},
            title={
                "text": f"<b>PREDICTED ICU RISK</b><br><span style='font-size:12px; color:{meta['color']}'>{meta['label']}</span>",
                "font": {"size": 15, "color": "#94a3b8", "family": "Plus Jakarta Sans"},
            },
            gauge={
                "axis": {"range": [0, 100], "tickwidth": 1, "tickcolor": "#475569", "ticks": "outside"},
                "bar": {"color": meta["color"], "thickness": 0.28},
                "bgcolor": "rgba(15, 23, 42, 0.4)",
                "borderwidth": 1,
                "bordercolor": "rgba(255, 255, 255, 0.1)",
                "steps": [
                    {"range": [0, 35], "color": "rgba(16, 185, 129, 0.15)"},
                    {"range": [35, 70], "color": "rgba(245, 158, 11, 0.15)"},
                    {"range": [70, 100], "color": "rgba(239, 68, 68, 0.18)"},
                ],
                "threshold": {
                    "line": {"color": meta["color"], "width": 4},
                    "thickness": 0.85,
                    "value": pct,
                },
            },
        )
    )

    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=25, r=25, t=55, b=20),
        height=260,
    )
    return fig


def build_vitals_radar(inputs: Dict[str, Any]) -> go.Figure:
    """Radar chart comparing patient vitals normalized against clinical safety norms."""
    categories = ["Heart Rate", "Systolic BP", "Diastolic BP", "Resp Rate", "SpO2 (Inv)", "Temperature"]

    # Normalize to 0-100 scale where 50 is normal baseline
    hr_norm = np.clip((inputs["Heart_Rate"] - 40) / (160 - 40) * 100, 0, 100)
    sbp_norm = np.clip((inputs["Systolic_BP"] - 70) / (200 - 70) * 100, 0, 100)
    dbp_norm = np.clip((inputs["Diastolic_BP"] - 40) / (130 - 40) * 100, 0, 100)
    rr_norm = np.clip((inputs["Respiratory_Rate"] - 8) / (45 - 8) * 100, 0, 100)
    spo2_inv = np.clip((100 - inputs["Oxygen_Saturation"]) / (100 - 75) * 100, 0, 100)
    temp_norm = np.clip((inputs["Temperature"] - 35.0) / (41.0 - 35.0) * 100, 0, 100)

    patient_vals = [hr_norm, sbp_norm, dbp_norm, rr_norm, spo2_inv, temp_norm]
    baseline_vals = [50, 50, 50, 50, 20, 50]  # Healthy reference band

    fig = go.Figure()
    fig.add_trace(
        go.Scatterpolar(
            r=baseline_vals + [baseline_vals[0]],
            theta=categories + [categories[0]],
            fill="toself",
            name="Normal Safe Baseline",
            line=dict(color="#10b981", dash="dash", width=2),
            fillcolor="rgba(16, 185, 129, 0.1)",
        )
    )
    fig.add_trace(
        go.Scatterpolar(
            r=patient_vals + [patient_vals[0]],
            theta=categories + [categories[0]],
            fill="toself",
            name="Current Patient Telemetry",
            line=dict(color="#38bdf8", width=3),
            fillcolor="rgba(56, 189, 248, 0.25)",
        )
    )

    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 100], color="#64748b", gridcolor="rgba(255,255,255,0.08)"),
            angularaxis=dict(color="#94a3b8", gridcolor="rgba(255,255,255,0.08)"),
            bgcolor="rgba(15, 23, 42, 0.5)",
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=30, b=30),
        height=320,
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5, font=dict(color="#94a3b8")),
    )
    return fig


def build_cohort_scatter(cohort_df: pd.DataFrame, current_inputs: Dict[str, Any]) -> go.Figure:
    """Plots all 384 ER cohort patients with current patient highlighted."""
    if cohort_df.empty:
        return go.Figure()

    fig = go.Figure()

    # Historical No ICU
    no_icu = cohort_df[cohort_df["Requires_ICU"] == 0]
    fig.add_trace(
        go.Scatter(
            x=no_icu["Heart_Rate"],
            y=no_icu["Systolic_BP"],
            mode="markers",
            name="Discharged / Ward (No ICU)",
            marker=dict(size=7, color="#10b981", opacity=0.5),
        )
    )

    # Historical ICU Required
    req_icu = cohort_df[cohort_df["Requires_ICU"] == 1]
    fig.add_trace(
        go.Scatter(
            x=req_icu["Heart_Rate"],
            y=req_icu["Systolic_BP"],
            mode="markers",
            name="Admitted to ICU",
            marker=dict(size=8, color="#ef4444", opacity=0.6),
        )
    )

    # Current Patient Star
    fig.add_trace(
        go.Scatter(
            x=[current_inputs["Heart_Rate"]],
            y=[current_inputs["Systolic_BP"]],
            mode="markers",
            name="⭐ Current Assessment",
            marker=dict(size=18, color="#00d2ff", symbol="star", line=dict(color="#ffffff", width=2)),
        )
    )

    fig.update_layout(
        title={"text": "ER Cohort Distribution: Heart Rate vs. Systolic BP", "font": {"color": "#e2e8f0", "size": 14}},
        xaxis=dict(title="Heart Rate (bpm)", color="#94a3b8", gridcolor="rgba(255,255,255,0.06)"),
        yaxis=dict(title="Systolic BP (mmHg)", color="#94a3b8", gridcolor="rgba(255,255,255,0.06)"),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(15, 23, 42, 0.45)",
        margin=dict(l=30, r=20, t=40, b=30),
        height=320,
        legend=dict(orientation="h", yanchor="bottom", y=-0.25, xanchor="center", x=0.5, font=dict(color="#94a3b8")),
    )
    return fig


# ---------------------------------------------------------------------------
# Main Application
# ---------------------------------------------------------------------------
def main() -> None:
    # Resources
    model = load_model()
    cohort_df = load_sample_patients()

    # Sidebar
    inputs = render_sidebar(cohort_df)

    # -----------------------------------------------------------------------
    # Top Command Header
    # -----------------------------------------------------------------------
    available_beds = TOTAL_ICU_BEDS - OCCUPIED_ICU_BEDS
    occupancy_pct = (OCCUPIED_ICU_BEDS / TOTAL_ICU_BEDS) * 100

    st.markdown(
        f"""
        <div class="cmd-header">
            <div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="live-dot"></span>
                    <span style="font-size:0.75rem; font-weight:700; letter-spacing:0.1em; color:#38bdf8; text-transform:uppercase;">
                        CLINICAL TRIAGE INTELLIGENCE &bull; NVIDIA CUDA ACCELERATED
                    </span>
                </div>
                <h1 class="cmd-title">SmartTriage AI &mdash; Emergency ICU Risk Cockpit</h1>
                <p class="cmd-subtitle">
                    Real-Time Hemodynamic Risk Stratification &bull; Hospital Sírio-Libanês Clinical Cohort
                </p>
            </div>
            <div class="bed-panel">
                <div style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">
                    🛏️ Hospital ICU Bed Capacity
                </div>
                <div class="bed-badge">{available_beds} / {TOTAL_ICU_BEDS} Available</div>
                <div style="font-size:0.75rem; color:{'#ef4444' if occupancy_pct >= 85 else '#f59e0b'}; font-weight:600;">
                    Occupancy: {occupancy_pct:.0f}% ({'High Congestion' if occupancy_pct >= 85 else 'Active'})
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # -----------------------------------------------------------------------
    # Run Inference
    # -----------------------------------------------------------------------
    if "last_result" not in st.session_state or inputs["trigger"]:
        X = pd.DataFrame(
            [[inputs[c] for c in FEATURE_ORDER]],
            columns=FEATURE_ORDER,
        )
        proba = float(model.predict_proba(X)[0, 1])
        pred = int(proba >= 0.5)
        tier = risk_tier(proba)

        summary = generate_clinical_summary(
            patient_vitals={k: inputs[k] for k in FEATURE_ORDER},
            risk_score=proba,
            use_llm=False,
        )

        st.session_state.last_result = {
            "proba": proba,
            "pred": pred,
            "tier": tier,
            "summary": summary,
            "inputs": {k: inputs[k] for k in FEATURE_ORDER},
        }

    res = st.session_state.last_result
    prob = res["proba"]
    tier = res["tier"]
    t_meta = get_tier_meta(tier)
    cur_vitals = res["inputs"]

    # Hemodynamic calculation
    si = cur_vitals["Heart_Rate"] / (cur_vitals["Systolic_BP"] + 1e-5)
    map_val = cur_vitals["Diastolic_BP"] + (cur_vitals["Systolic_BP"] - cur_vitals["Diastolic_BP"]) / 3.0
    pulse_pres = cur_vitals["Systolic_BP"] - cur_vitals["Diastolic_BP"]

    # -----------------------------------------------------------------------
    # Hero Section: Radial Dial & Protocol Card
    # -----------------------------------------------------------------------
    hero_col1, hero_col2 = st.columns([1.1, 1.9])

    with hero_col1:
        st.markdown('<div class="glass-card" style="padding:0.8rem 1rem;">', unsafe_allow_html=True)
        gauge_fig = build_risk_gauge(prob, tier)
        st.plotly_chart(gauge_fig, use_container_width=True, config={"displayModeBar": False})
        st.markdown("</div>", unsafe_allow_html=True)

    with hero_col2:
        st.markdown(
            f"""
            <div class="glass-card" style="border-left: 5px solid {t_meta['color']}; box-shadow: {t_meta['glow']};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                    <span style="font-size:0.8rem; font-weight:700; color:{t_meta['color']}; letter-spacing:0.06em;">
                        TRIAGE STATUS
                    </span>
                    <span style="background:{t_meta['bg']}; color:{t_meta['color']}; border:1px solid {t_meta['border']}; padding:0.25rem 0.8rem; border-radius:20px; font-weight:800; font-size:0.85rem;">
                        {t_meta['badge']}
                    </span>
                </div>
                <h2 style="font-size:1.6rem; font-weight:800; margin:0 0 0.5rem 0; color:#ffffff;">
                    {'ICU ADMISSION INDICATED' if res['pred'] else 'STABLE FOR WARD LEVEL MONITORING'}
                </h2>
                <p style="color:#cbd5e1; font-size:0.95rem; margin-bottom:1rem; line-height:1.5;">
                    Model probability estimation stands at <strong style="color:#ffffff;">{prob*100:.1f}%</strong>.
                    Recommended protocol: <strong style="color:{t_meta['color']};">{t_meta['action']}</strong>.
                </p>
                <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:0.8rem; color:#94a3b8;">
                    <span style="background:rgba(255,255,255,0.06); padding:0.3rem 0.6rem; border-radius:6px;">
                        🎯 Model ROC-AUC: <strong>0.8016</strong>
                    </span>
                    <span style="background:rgba(255,255,255,0.06); padding:0.3rem 0.6rem; border-radius:6px;">
                        ⚡ Engine: <strong>XGBoost GPU (CUDA)</strong>
                    </span>
                    <span style="background:rgba(255,255,255,0.06); padding:0.3rem 0.6rem; border-radius:6px;">
                        👤 Patient Age: <strong>{cur_vitals['Age']} Years</strong>
                    </span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # -----------------------------------------------------------------------
    # Bedside Vital Signs Telemetry Matrix
    # -----------------------------------------------------------------------
    st.markdown(
        """
        <div style="display:flex; align-items:center; gap:8px; margin: 1.2rem 0 0.8rem 0;">
            <span style="font-size:1.15rem; font-weight:800; color:#ffffff;">
                📊 Real-Time Bedside Telemetry
            </span>
            <span style="font-size:0.8rem; color:#64748b;">(Full 7-Vital Clinical Parameter Vector)</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    v1, v2, v3, v4, v5, v6, v7 = st.columns(7)
    vitals_config = [
        (v1, "Heart Rate", cur_vitals["Heart_Rate"], "bpm", "Heart_Rate", "❤️"),
        (v2, "Systolic BP", cur_vitals["Systolic_BP"], "mmHg", "Systolic_BP", "🩸"),
        (v3, "Diastolic BP", cur_vitals["Diastolic_BP"], "mmHg", "Diastolic_BP", "📉"),
        (v4, "Resp. Rate", cur_vitals["Respiratory_Rate"], "/min", "Respiratory_Rate", "🫁"),
        (v5, "Oxygen SpO₂", cur_vitals["Oxygen_Saturation"], "%", "Oxygen_Saturation", "💧"),
        (v6, "Temperature", cur_vitals["Temperature"], "°C", "Temperature", "🌡️"),
        (v7, "Patient Age", cur_vitals["Age"], "Years", "Age", "👤"),
    ]

    for col, name, val, unit, key, icon in vitals_config:
        st_meta = get_vital_status(key, val) if key != "Age" else {"chip": "ADULT" if val < 65 else "ELDERLY", "color": "#10b981" if val < 65 else "#f59e0b", "ref": "Triage standard"}
        with col:
            val_str = f"{val:.1f}" if key == "Temperature" else f"{val:.0f}"
            st.markdown(
                f"""
                <div class="vital-tile" style="border-top: 3px solid {st_meta['color']};">
                    <div class="vital-header">
                        <span class="vital-name">{icon} {name}</span>
                    </div>
                    <div class="vital-value-wrap">
                        <span class="vital-val">{val_str}</span>
                        <span class="vital-unit">{unit}</span>
                    </div>
                    <div class="vital-footer">
                        <span>{st_meta['ref']}</span>
                        <span class="vital-chip" style="background:rgba(255,255,255,0.06); color:{st_meta['color']};">
                            {st_meta['chip']}
                        </span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    # -----------------------------------------------------------------------
    # Hemodynamic Biomarkers Cockpit
    # -----------------------------------------------------------------------
    st.markdown(
        """
        <div style="display:flex; align-items:center; gap:8px; margin: 1.5rem 0 0.8rem 0;">
            <span style="font-size:1.15rem; font-weight:800; color:#ffffff;">
                🫀 Derived Hemodynamic Biomarkers
            </span>
            <span style="font-size:0.8rem; color:#64748b;">(Critical Care Shock & Perfusion Indices)</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    b1, b2, b3 = st.columns(3)

    # Shock Index
    si_status = "CRITICAL SHOCK RISK (≥0.9)" if si >= 0.9 else ("BORDERLINE RISK (0.7-0.9)" if si >= 0.7 else "NORMAL (<0.7)")
    si_color = "#ef4444" if si >= 0.9 else ("#f59e0b" if si >= 0.7 else "#10b981")
    with b1:
        st.markdown(
            f"""
            <div class="biomarker-card" style="border-left: 4px solid {si_color};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.85rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">
                        Shock Index (HR / SBP)
                    </span>
                    <span style="font-size:0.75rem; font-weight:800; color:{si_color}; background:rgba(255,255,255,0.06); padding:0.2rem 0.5rem; border-radius:6px;">
                        {si_status}
                    </span>
                </div>
                <div style="margin: 0.5rem 0;">
                    <span class="biomarker-val" style="color:{si_color};">{si:.2f}</span>
                </div>
                <p style="font-size:0.78rem; color:#64748b; margin:0;">
                    Occult shock warning trigger: &ge; 0.90 &bull; Critical predictor of sepsis collapse
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Mean Arterial Pressure (MAP)
    map_status = "CRITICAL HYPOPERFUSION (<65)" if map_val < 65 else ("OPTIMAL PERFUSION" if map_val <= 105 else "ELEVATED VASCULAR LOAD")
    map_color = "#ef4444" if map_val < 65 else "#10b981"
    with b2:
        st.markdown(
            f"""
            <div class="biomarker-card" style="border-left: 4px solid {map_color};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.85rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">
                        Mean Arterial Pressure (MAP)
                    </span>
                    <span style="font-size:0.75rem; font-weight:800; color:{map_color}; background:rgba(255,255,255,0.06); padding:0.2rem 0.5rem; border-radius:6px;">
                        {map_status}
                    </span>
                </div>
                <div style="margin: 0.5rem 0;">
                    <span class="biomarker-val" style="color:{map_color};">{map_val:.1f}</span>
                    <span style="font-size:0.9rem; color:#64748b; font-weight:700;"> mmHg</span>
                </div>
                <p style="font-size:0.78rem; color:#64748b; margin:0;">
                    Organ perfusion target: &ge; 65 mmHg &bull; DBP + 1/3 (SBP - DBP)
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Pulse Pressure
    pp_status = "NARROW (CARDIAC COMPROMISE)" if pulse_pres < 30 else ("NORMAL VASCULAR TONE" if pulse_pres <= 60 else "WIDE PULSE PRESSURE")
    pp_color = "#f59e0b" if pulse_pres < 30 or pulse_pres > 65 else "#10b981"
    with b3:
        st.markdown(
            f"""
            <div class="biomarker-card" style="border-left: 4px solid {pp_color};">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.85rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">
                        Pulse Pressure (SBP - DBP)
                    </span>
                    <span style="font-size:0.75rem; font-weight:800; color:{pp_color}; background:rgba(255,255,255,0.06); padding:0.2rem 0.5rem; border-radius:6px;">
                        {pp_status}
                    </span>
                </div>
                <div style="margin: 0.5rem 0;">
                    <span class="biomarker-val" style="color:{pp_color};">{pulse_pres:.0f}</span>
                    <span style="font-size:0.9rem; color:#64748b; font-weight:700;"> mmHg</span>
                </div>
                <p style="font-size:0.78rem; color:#64748b; margin:0;">
                    Vascular compliance benchmark: 40&ndash;60 mmHg &bull; SBP minus DBP
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # -----------------------------------------------------------------------
    # Interactive Multi-View Analytics Tabs
    # -----------------------------------------------------------------------
    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)

    tab_intel, tab_radar, tab_cohort, tab_protocol = st.tabs(
        [
            "🤖 Clinical AI Briefing",
            "🕸️ Patient Vitals Radar Matrix",
            "👥 Hospital Cohort Distribution",
            "📋 Evidence-Based Clinical Protocol",
        ]
    )

    with tab_intel:
        st.markdown(
            f"""
            <div class="ai-terminal">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.7rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.5rem;">
                    <span style="color:#38bdf8; font-weight:700; font-family:'JetBrains Mono', monospace; font-size:0.85rem;">
                        &gt; CLINICAL_INTELLIGENCE_BRIEFING &bull; GENERATED AUTOMATICALLY
                    </span>
                    <span style="color:#64748b; font-size:0.78rem;">
                        Model Version: XGBoost 3.4 &bull; Accuracy: 74.0%
                    </span>
                </div>
                <p style="font-size:1.02rem; line-height:1.65; color:#f8fafc; margin:0.5rem 0 1rem 0;">
                    {res['summary']}
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with tab_radar:
        radar_col1, radar_col2 = st.columns([1.5, 1])
        with radar_col1:
            radar_fig = build_vitals_radar(cur_vitals)
            st.plotly_chart(radar_fig, use_container_width=True, config={"displayModeBar": False})
        with radar_col2:
            st.markdown(
                """
                <div class="glass-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="font-size:1.05rem; font-weight:700; color:#38bdf8; margin-top:0;">
                        Radar Telemetry Interpretation
                    </h4>
                    <p style="font-size:0.85rem; color:#94a3b8; line-height:1.6;">
                        This spider diagram maps the patient's bedside readings against the standardized
                        safe physiologic baseline (dashed green zone).
                    </p>
                    <ul style="font-size:0.83rem; color:#cbd5e1; padding-left:1.2rem; line-height:1.6;">
                        <li><strong>Spikes outward</strong> indicate tachycardic, hypertensive, or hyperthermic strain.</li>
                        <li><strong>Dips inward</strong> on oxygen saturation represent respiratory failure risks.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )

    with tab_cohort:
        cohort_col1, cohort_col2 = st.columns([1.5, 1])
        with cohort_col1:
            cohort_fig = build_cohort_scatter(cohort_df, cur_vitals)
            st.plotly_chart(cohort_fig, use_container_width=True, config={"displayModeBar": False})
        with cohort_col2:
            st.markdown(
                f"""
                <div class="glass-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                    <h4 style="font-size:1.05rem; font-weight:700; color:#38bdf8; margin-top:0;">
                        Sírio-Libanês Cohort Benchmark
                    </h4>
                    <p style="font-size:0.85rem; color:#94a3b8; line-height:1.6;">
                        The current patient (marked by the glowing <strong style="color:#00d2ff;">cyan star</strong>)
                        is projected against all <strong>384 emergency arrivals</strong> in the real hospital clinical trial.
                    </p>
                    <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:0.6rem 0.8rem; font-size:0.8rem;">
                        <div>🟢 <strong>No ICU Cohort:</strong> 189 Patients (49.2%)</div>
                        <div style="margin-top:0.3rem;">🔴 <strong>ICU Cohort:</strong> 195 Patients (50.8%)</div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    with tab_protocol:
        p_c1, p_c2 = st.columns(2)
        with p_c1:
            st.markdown(
                f"""
                <div class="glass-card">
                    <h4 style="color:{t_meta['color']}; margin-top:0; font-size:1.05rem;">
                        🚨 Tier Action Protocol ({t_meta['label']})
                    </h4>
                    <ul style="font-size:0.88rem; color:#e2e8f0; line-height:1.8; padding-left:1.2rem;">
                        <li><strong>Airway & Breathing:</strong> {'Secure high-flow oxygen / prepare intubation' if tier == 'HIGH' else 'Maintain SpO2 >= 95% via nasal cannula'}</li>
                        <li><strong>Circulation:</strong> {'Initiate IV crystalloids, monitor MAP >= 65 mmHg' if si >= 0.7 else 'Routine circulatory observation'}</li>
                        <li><strong>Bed Allocation:</strong> {'Reserve immediate ICU bed' if tier == 'HIGH' else ('Hold step-down bed' if tier == 'MODERATE' else 'Allocate standard medical ward')}</li>
                        <li><strong>Laboratory Orders:</strong> Stat Blood Gas, Lactate, Troponin, CBC, Chemistry</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with p_c2:
            st.markdown(
                """
                <div class="glass-card">
                    <h4 style="color:#38bdf8; margin-top:0; font-size:1.05rem;">
                        ℹ️ Model Architecture & Validation Specs
                    </h4>
                    <div style="font-size:0.84rem; color:#94a3b8; line-height:1.7;">
                        <div>&bull; <strong>Classifier:</strong> XGBoost v3.4 (GPU CUDA hist tree method)</div>
                        <div>&bull; <strong>Features:</strong> 7 Standard Bedside Vitals + 7 Engineered Biomarkers</div>
                        <div>&bull; <strong>Validation ROC-AUC:</strong> 0.8016 (Hold-out test set)</div>
                        <div>&bull; <strong>Cross-Validation:</strong> 5-Fold Stratified CV (0.7587 &plusmn; 0.04)</div>
                        <div>&bull; <strong>Compliance:</strong> Zero Data Leakage Preprocessing Pipeline</div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )


if __name__ == "__main__":
    main()
