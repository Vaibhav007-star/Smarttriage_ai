"""
SmartTriage AI — Step 3: GenAI Clinical Summarizer
==================================================
Generates concise, clinician-style briefings for high-risk triage cases.

Design choices for portfolio reliability:
- Primary path: high-quality rule-based clinical template engine
  (fast, deterministic, zero external dependency, works offline).
- Optional path: Hugging Face transformers pipeline (Zephyr / small Llama)
  when a GPU / sufficient RAM is available and the user enables it.

Public API:
    generate_clinical_summary(patient_vitals: dict, risk_score: float) -> str
"""

from __future__ import annotations

import logging
import sys
from typing import Any, Dict, List, Optional

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
logger = logging.getLogger("summarizer")

# ---------------------------------------------------------------------------
# Clinical thresholds (evidence-based ranges used by triage systems)
# ---------------------------------------------------------------------------
THRESHOLDS = {
    "Heart_Rate": {"low": 60, "high": 110, "critical_high": 130},
    "Systolic_BP": {"low": 90, "high": 160, "critical_high": 180, "critical_low": 80},
    "Diastolic_BP": {"low": 60, "high": 100, "critical_high": 110},
    "Respiratory_Rate": {"low": 12, "high": 22, "critical_high": 30},
    "Oxygen_Saturation": {"low": 94, "critical_low": 90},
    "Temperature": {"low": 36.0, "high": 38.0, "critical_high": 39.5},
    "Age": {"high_risk": 65},
}


def _flag_vital(name: str, value: float) -> Optional[str]:
    """Return a short clinical flag string or None if within normal limits."""
    t = THRESHOLDS.get(name)
    if t is None or value is None:
        return None

    if name == "Oxygen_Saturation":
        if value < t["critical_low"]:
            return f"critical hypoxemia (SpO2 {value:.0f}%)"
        if value < t["low"]:
            return f"hypoxemia (SpO2 {value:.0f}%)"
        return None

    if name == "Heart_Rate":
        if value >= t["critical_high"]:
            return f"severe tachycardia ({value:.0f} bpm)"
        if value > t["high"]:
            return f"tachycardia ({value:.0f} bpm)"
        if value < t["low"]:
            return f"bradycardia ({value:.0f} bpm)"
        return None

    if name == "Systolic_BP":
        if value >= t.get("critical_high", 999):
            return f"hypertensive urgency (SBP {value:.0f} mmHg)"
        if value > t["high"]:
            return f"hypertension (SBP {value:.0f} mmHg)"
        if value <= t.get("critical_low", 0):
            return f"critical hypotension (SBP {value:.0f} mmHg)"
        if value < t["low"]:
            return f"hypotension (SBP {value:.0f} mmHg)"
        return None

    if name == "Diastolic_BP":
        if value >= t.get("critical_high", 999):
            return f"elevated diastolic pressure ({value:.0f} mmHg)"
        if value > t["high"]:
            return f"diastolic hypertension ({value:.0f} mmHg)"
        if value < t["low"]:
            return f"low diastolic pressure ({value:.0f} mmHg)"
        return None

    if name == "Respiratory_Rate":
        if value >= t["critical_high"]:
            return f"severe tachypnea ({value:.0f}/min)"
        if value > t["high"]:
            return f"tachypnea ({value:.0f}/min)"
        if value < t["low"]:
            return f"bradypnea ({value:.0f}/min)"
        return None

    if name == "Temperature":
        if value >= t.get("critical_high", 999):
            return f"high fever ({value:.1f}°C)"
        if value > t["high"]:
            return f"fever ({value:.1f}°C)"
        if value < t["low"]:
            return f"hypothermia ({value:.1f}°C)"
        return None

    return None


def _collect_risk_factors(vitals: Dict[str, Any]) -> List[str]:
    """Return ordered list of clinical risk-factor phrases."""
    factors: List[str] = []

    age = vitals.get("Age")
    if age is not None and age >= THRESHOLDS["Age"]["high_risk"]:
        factors.append(f"advanced age ({int(age)} y)")

    for key in [
        "Oxygen_Saturation",
        "Heart_Rate",
        "Respiratory_Rate",
        "Systolic_BP",
        "Diastolic_BP",
        "Temperature",
    ]:
        val = vitals.get(key)
        if val is not None:
            flag = _flag_vital(key, float(val))
            if flag:
                factors.append(flag)

    # Hemodynamic biomarkers
    hr = vitals.get("Heart_Rate")
    sbp = vitals.get("Systolic_BP")
    dbp = vitals.get("Diastolic_BP")
    if hr is not None and sbp is not None and float(sbp) > 0:
        si = float(hr) / float(sbp)
        if si >= 0.9:
            factors.append(f"critical shock index ({si:.2f})")
    if sbp is not None and dbp is not None:
        map_val = float(dbp) + (float(sbp) - float(dbp)) / 3.0
        if map_val < 65:
            factors.append(f"hypoperfusion (MAP {map_val:.0f} mmHg)")

    return factors


def _risk_tier(score: float) -> str:
    if score >= 0.70:
        return "HIGH"
    if score >= 0.35:
        return "MODERATE"
    return "LOW"


def _generate_rule_based_summary(
    patient_vitals: Dict[str, Any],
    risk_score: float,
) -> str:
    """
    Produce a clean 3-sentence clinical briefing.
    Matches the system prompt required by the master specification.
    """
    factors = _collect_risk_factors(patient_vitals)
    tier = _risk_tier(risk_score)
    age = patient_vitals.get("Age", "unknown")
    hr = patient_vitals.get("Heart_Rate")
    sbp = patient_vitals.get("Systolic_BP")
    dbp = patient_vitals.get("Diastolic_BP")
    rr = patient_vitals.get("Respiratory_Rate")
    spo2 = patient_vitals.get("Oxygen_Saturation")

    # Sentence 1 – snapshot of key vitals
    vital_parts = []
    if hr is not None:
        vital_parts.append(f"HR {hr:.0f}")
    if sbp is not None and dbp is not None:
        vital_parts.append(f"BP {sbp:.0f}/{dbp:.0f}")
    if rr is not None:
        vital_parts.append(f"RR {rr:.0f}")
    if spo2 is not None:
        vital_parts.append(f"SpO2 {spo2:.0f}%")
    vital_str = ", ".join(vital_parts) if vital_parts else "vitals incomplete"

    sentence1 = (
        f"Patient (age {age}) presents with {vital_str}; "
        f"model-estimated ICU risk is {risk_score*100:.0f}% ({tier})."
    )

    # Sentence 2 – highlight risk factors
    if factors:
        if len(factors) == 1:
            sentence2 = f"Primary concern is {factors[0]}."
        elif len(factors) == 2:
            sentence2 = f"Key risk factors: {factors[0]} and {factors[1]}."
        else:
            sentence2 = (
                f"Multiple concerning findings: {', '.join(factors[:-1])}, "
                f"and {factors[-1]}."
            )
    else:
        sentence2 = "No major vital-sign abnormalities detected on current measurements."

    # Sentence 3 – clear immediate recommendation
    if tier == "HIGH":
        sentence3 = (
            "Immediate recommendation: escalate to critical-care team, "
            "secure airway/oxygen support, and prepare for possible ICU transfer."
        )
    elif tier == "MODERATE":
        sentence3 = (
            "Immediate recommendation: increase monitoring frequency, "
            "reassess within 30–60 minutes, and consider early senior review."
        )
    else:
        sentence3 = (
            "Immediate recommendation: routine ward-level observation; "
            "re-evaluate if clinical status changes."
        )

    return f"{sentence1} {sentence2} {sentence3}"


# ---------------------------------------------------------------------------
# Optional Hugging Face path (disabled by default for reliability)
# ---------------------------------------------------------------------------
_HF_PIPELINE = None


def _try_load_hf_pipeline(model_name: str = "HuggingFaceH4/zephyr-7b-beta") -> bool:
    """Attempt to load a local HF text-generation pipeline. Returns True on success."""
    global _HF_PIPELINE
    if _HF_PIPELINE is not None:
        return True
    try:
        from transformers import pipeline  # type: ignore

        logger.info("Attempting to load Hugging Face model: %s", model_name)
        _HF_PIPELINE = pipeline(
            "text-generation",
            model=model_name,
            device_map="auto",
            max_new_tokens=120,
            do_sample=False,
        )
        logger.info("HF pipeline loaded successfully.")
        return True
    except Exception as exc:
        logger.warning("HF pipeline unavailable (%s). Falling back to rule-based engine.", exc)
        _HF_PIPELINE = None
        return False


def _generate_hf_summary(
    patient_vitals: Dict[str, Any],
    risk_score: float,
) -> Optional[str]:
    """Generate summary via local LLM if the pipeline is loaded."""
    if _HF_PIPELINE is None:
        return None

    system_prompt = (
        "You are an AI Clinical Assistant. Summarize this patient's critical vitals "
        "in exactly 3 short sentences. Highlight risk factors and provide a clear "
        "immediate recommendation."
    )
    context = (
        f"Patient vitals: {patient_vitals}. "
        f"Predicted ICU admission probability: {risk_score:.2f}."
    )
    prompt = f"<|system|>\n{system_prompt}</s>\n<|user|>\n{context}</s>\n<|assistant|>\n"

    try:
        out = _HF_PIPELINE(prompt, return_full_text=False)
        text = out[0]["generated_text"].strip()
        # Keep only first three sentences if the model is verbose
        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
        return ". ".join(sentences[:3]) + "."
    except Exception as exc:
        logger.error("HF generation failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def generate_clinical_summary(
    patient_vitals: Dict[str, Any],
    risk_score: float,
    use_llm: bool = False,
) -> str:
    """
    Generate a 3-sentence clinical briefing.

    Parameters
    ----------
    patient_vitals : dict
        Keys expected (any subset is accepted):
        Age, Heart_Rate, Systolic_BP, Diastolic_BP,
        Respiratory_Rate, Oxygen_Saturation, Temperature, Gender
    risk_score : float
        Probability in [0, 1] returned by the ICU risk model.
    use_llm : bool, default False
        If True, attempt to use a local Hugging Face model.
        Falls back automatically to the rule-based engine on any failure.

    Returns
    -------
    str
        Clean clinical summary (exactly three sentences).
    """
    if not 0.0 <= risk_score <= 1.0:
        raise ValueError(f"risk_score must be between 0 and 1, got {risk_score}")

    if use_llm and _try_load_hf_pipeline():
        hf_text = _generate_hf_summary(patient_vitals, risk_score)
        if hf_text:
            logger.info("Summary generated via Hugging Face model.")
            return hf_text

    logger.info("Summary generated via rule-based clinical engine.")
    return _generate_rule_based_summary(patient_vitals, risk_score)


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------
def _self_test() -> None:
    """Run a few representative cases and print results."""
    cases = [
        {
            "name": "High-risk elderly",
            "vitals": {
                "Age": 82,
                "Heart_Rate": 128,
                "Systolic_BP": 88,
                "Diastolic_BP": 52,
                "Respiratory_Rate": 28,
                "Oxygen_Saturation": 87,
                "Temperature": 38.9,
            },
            "score": 0.86,
        },
        {
            "name": "Moderate risk",
            "vitals": {
                "Age": 58,
                "Heart_Rate": 105,
                "Systolic_BP": 148,
                "Diastolic_BP": 92,
                "Respiratory_Rate": 20,
                "Oxygen_Saturation": 93,
                "Temperature": 37.6,
            },
            "score": 0.48,
        },
        {
            "name": "Low risk",
            "vitals": {
                "Age": 34,
                "Heart_Rate": 72,
                "Systolic_BP": 118,
                "Diastolic_BP": 76,
                "Respiratory_Rate": 14,
                "Oxygen_Saturation": 98,
                "Temperature": 36.7,
            },
            "score": 0.12,
        },
    ]

    print("\n" + "=" * 70)
    print("SmartTriage AI — Clinical Summarizer Self-Test")
    print("=" * 70)
    for case in cases:
        summary = generate_clinical_summary(case["vitals"], case["score"])
        print(f"\n[{case['name']}] risk={case['score']:.0%}")
        print(summary)
    print("\n" + "=" * 70)


if __name__ == "__main__":
    _self_test()
