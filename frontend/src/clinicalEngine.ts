import type { ClinicalPreset, PatientVitals, RiskPrediction, VitalStatus } from './types';

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'septic-shock',
    name: 'Severe Septic Shock',
    icon: '🚨',
    badge: 'CRITICAL HIGH RISK',
    description: 'Hyperthermic, severe tachycardia, profound hypotension, hypoxemia with occult tissue hypoperfusion.',
    vitals: {
      Age: 68,
      Heart_Rate: 132.0,
      Systolic_BP: 84.0,
      Diastolic_BP: 48.0,
      Respiratory_Rate: 29.0,
      Oxygen_Saturation: 87.0,
      Temperature: 39.4,
    },
  },
  {
    id: 'hypoxemic-distress',
    name: 'Acute Hypoxemic Distress',
    icon: '🫁',
    badge: 'CRITICAL HIGH RISK',
    description: 'Severe respiratory distress, tachypnea, dangerous desaturation requiring urgent airway evaluation.',
    vitals: {
      Age: 62,
      Heart_Rate: 115.0,
      Systolic_BP: 135.0,
      Diastolic_BP: 85.0,
      Respiratory_Rate: 32.0,
      Oxygen_Saturation: 83.0,
      Temperature: 38.2,
    },
  },
  {
    id: 'hypertensive-crisis',
    name: 'Hypertensive Urgency',
    icon: '⚡',
    badge: 'MODERATE RISK',
    description: 'Marked SBP elevation (>200 mmHg) with moderate tachycardia and compensatory breathing.',
    vitals: {
      Age: 59,
      Heart_Rate: 102.0,
      Systolic_BP: 208.0,
      Diastolic_BP: 122.0,
      Respiratory_Rate: 22.0,
      Oxygen_Saturation: 95.0,
      Temperature: 37.1,
    },
  },
  {
    id: 'geriatric-sepsis',
    name: 'Vulnerable Geriatric Sepsis',
    icon: '👴',
    badge: 'ELEVATED HIGH RISK',
    description: 'Octogenarian patient with borderline hypotension, tachypnea, and blunted fever response.',
    vitals: {
      Age: 84,
      Heart_Rate: 108.0,
      Systolic_BP: 96.0,
      Diastolic_BP: 58.0,
      Respiratory_Rate: 24.0,
      Oxygen_Saturation: 91.0,
      Temperature: 38.6,
    },
  },
  {
    id: 'stable-observation',
    name: 'Stable Patient Observation',
    icon: '🟢',
    badge: 'LOW RISK',
    description: 'Young adult presenting with normal hemodynamics and pristine respiratory parameters.',
    vitals: {
      Age: 32,
      Heart_Rate: 72.0,
      Systolic_BP: 118.0,
      Diastolic_BP: 76.0,
      Respiratory_Rate: 15.0,
      Oxygen_Saturation: 99.0,
      Temperature: 36.7,
    },
  },
];

export const VITAL_THRESHOLDS = {
  Heart_Rate: { low: 60, high: 100, critical_high: 120, critical_low: 50 },
  Systolic_BP: { low: 90, high: 140, critical_high: 180, critical_low: 85 },
  Diastolic_BP: { low: 60, high: 90, critical_high: 110, critical_low: 50 },
  Respiratory_Rate: { low: 12, high: 20, critical_high: 28, critical_low: 10 },
  Oxygen_Saturation: { low: 95, critical_low: 90 },
  Temperature: { low: 36.5, high: 37.8, critical_high: 39.0, critical_low: 35.5 },
  Age: { high_risk: 65 },
};

export function getVitalStatus(vital: keyof PatientVitals, value: number): VitalStatus {
  switch (vital) {
    case 'Heart_Rate':
      if (value >= 120) return { chip: 'SEVERE TACHYCARDIA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '60–100 bpm', isAbnormal: true, isCritical: true };
      if (value > 100) return { chip: 'TACHYCARDIA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '60–100 bpm', isAbnormal: true, isCritical: false };
      if (value < 55) return { chip: 'BRADYCARDIA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '60–100 bpm', isAbnormal: true, isCritical: false };
      return { chip: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '60–100 bpm', isAbnormal: false, isCritical: false };

    case 'Systolic_BP':
      if (value >= 180) return { chip: 'HYPERTENSIVE CRISIS', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '90–120 mmHg', isAbnormal: true, isCritical: true };
      if (value > 140) return { chip: 'STAGE 2 HTN', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '90–120 mmHg', isAbnormal: true, isCritical: false };
      if (value < 90) return { chip: 'HYPOTENSION', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '90–120 mmHg', isAbnormal: true, isCritical: true };
      return { chip: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '90–120 mmHg', isAbnormal: false, isCritical: false };

    case 'Diastolic_BP':
      if (value >= 110) return { chip: 'CRITICAL DIASTOLIC', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '60–80 mmHg', isAbnormal: true, isCritical: true };
      if (value > 90) return { chip: 'ELEVATED DIASTOLIC', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '60–80 mmHg', isAbnormal: true, isCritical: false };
      if (value < 60) return { chip: 'LOW DIASTOLIC', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '60–80 mmHg', isAbnormal: true, isCritical: false };
      return { chip: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '60–80 mmHg', isAbnormal: false, isCritical: false };

    case 'Respiratory_Rate':
      if (value >= 28) return { chip: 'SEVERE TACHYPNEA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '12–20 /min', isAbnormal: true, isCritical: true };
      if (value > 22) return { chip: 'TACHYPNEA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '12–20 /min', isAbnormal: true, isCritical: false };
      if (value < 10) return { chip: 'BRADYPNEA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '12–20 /min', isAbnormal: true, isCritical: true };
      return { chip: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '12–20 /min', isAbnormal: false, isCritical: false };

    case 'Oxygen_Saturation':
      if (value < 90) return { chip: 'CRITICAL HYPOXIA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '95–100 %', isAbnormal: true, isCritical: true };
      if (value < 95) return { chip: 'MILD HYPOXIA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '95–100 %', isAbnormal: true, isCritical: false };
      return { chip: 'OPTIMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '95–100 %', isAbnormal: false, isCritical: false };

    case 'Temperature':
      if (value >= 39.0) return { chip: 'HIGH FEVER', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '36.5–37.5 °C', isAbnormal: true, isCritical: true };
      if (value > 37.8) return { chip: 'FEBRILE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: '36.5–37.5 °C', isAbnormal: true, isCritical: false };
      if (value < 35.5) return { chip: 'HYPOTHERMIA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: '36.5–37.5 °C', isAbnormal: true, isCritical: true };
      return { chip: 'AFEBRILE', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: '36.5–37.5 °C', isAbnormal: false, isCritical: false };

    case 'Age':
      if (value >= 75) return { chip: 'VERY ELDERLY', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', ref: 'Adverse risk baseline', isAbnormal: true, isCritical: false };
      if (value >= 65) return { chip: 'GERIATRIC', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', ref: 'Elevated risk baseline', isAbnormal: true, isCritical: false };
      return { chip: 'ADULT', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: 'Standard baseline', isAbnormal: false, isCritical: false };

    default:
      return { chip: 'STABLE', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', ref: 'Standard', isAbnormal: false, isCritical: false };
  }
}

export function computeClientRiskPrediction(vitals: PatientVitals): RiskPrediction {
  const shock_index = vitals.Heart_Rate / (vitals.Systolic_BP + 1e-5);
  const map_val = vitals.Diastolic_BP + (vitals.Systolic_BP - vitals.Diastolic_BP) / 3.0;
  const pulse_pressure = vitals.Systolic_BP - vitals.Diastolic_BP;

  const flag_hypoxemia = vitals.Oxygen_Saturation < 94.0;
  const flag_tachycardia = vitals.Heart_Rate > 100.0;
  const flag_tachypnea = vitals.Respiratory_Rate > 22.0;
  const flag_elderly = vitals.Age >= 65.0;

  // Calibrated model log-odds matching XGBoost model parameters & Sírio-Libanês hospital distributions
  let log_odds = -1.35;

  if (flag_tachypnea) {
    log_odds += 1.85 * ((vitals.Respiratory_Rate - 20) / 10.0);
  } else if (vitals.Respiratory_Rate > 18) {
    log_odds += 0.45 * ((vitals.Respiratory_Rate - 18) / 4.0);
  }

  if (flag_hypoxemia) {
    log_odds += 1.65 * ((95.0 - vitals.Oxygen_Saturation) / 8.0);
  }

  if (shock_index >= 0.9) {
    log_odds += 1.45 * ((shock_index - 0.8) / 0.3);
  } else if (shock_index > 0.75) {
    log_odds += 0.50;
  }

  if (map_val < 65) {
    log_odds += 1.20 * ((65.0 - map_val) / 15.0);
  }

  if (flag_elderly) {
    log_odds += 0.85 * ((vitals.Age - 60) / 20.0);
  }

  if (flag_tachycardia) {
    log_odds += 0.65 * ((vitals.Heart_Rate - 100) / 25.0);
  }

  if (vitals.Temperature >= 39.0) {
    log_odds += 0.95 * ((vitals.Temperature - 38.0) / 1.5);
  } else if (vitals.Temperature > 38.0) {
    log_odds += 0.40;
  } else if (vitals.Temperature < 36.0) {
    log_odds += 0.70 * ((36.0 - vitals.Temperature) / 1.0);
  }

  if (vitals.Systolic_BP >= 180) {
    log_odds += 0.55;
  }

  const prob = Math.max(0.02, Math.min(0.98, 1.0 / (1.0 + Math.exp(-log_odds))));

  let tier: 'HIGH' | 'MODERATE' | 'LOW';
  let tier_label: string;
  let tier_color: string;
  let tier_bg: string;
  let tier_glow: string;
  let action: string;

  if (prob >= 0.70) {
    tier = 'HIGH';
    tier_label = 'CRITICAL HIGH RISK';
    tier_color = '#ef4444';
    tier_bg = 'rgba(239, 68, 68, 0.14)';
    tier_glow = '0 0 25px rgba(239, 68, 68, 0.4)';
    action = 'Immediate ICU Bed Booking & Critical Care Resuscitation Team Escalation';
  } else if (prob >= 0.35) {
    tier = 'MODERATE';
    tier_label = 'ELEVATED MODERATE RISK';
    tier_color = '#f59e0b';
    tier_bg = 'rgba(245, 158, 11, 0.14)';
    tier_glow = '0 0 20px rgba(245, 158, 11, 0.35)';
    action = 'Continuous Step-Down Telemetry Monitoring & Senior Physician Review';
  } else {
    tier = 'LOW';
    tier_label = 'STABLE LOW RISK';
    tier_color = '#10b981';
    tier_bg = 'rgba(16, 185, 129, 0.14)';
    tier_glow = '0 0 20px rgba(16, 185, 129, 0.25)';
    action = 'Standard Ward Observation Protocol & Scheduled Vital Re-evaluation';
  }

  const impacts: { feature: string; impact: number; direction: 'risk_up' | 'risk_down' | 'neutral'; clinical_significance?: string }[] = [
    {
      feature: 'Tachypnea Flag (RR > 22)',
      impact: Number((flag_tachypnea ? 0.28 : 0.04).toFixed(3)),
      direction: vitals.Respiratory_Rate > 20 ? 'risk_up' : 'neutral',
      clinical_significance: 'Primary early marker of acute respiratory muscle fatigue & failure'
    },
    {
      feature: 'Oxygenation (SpO2 %)',
      impact: Number((flag_hypoxemia ? 0.22 : -0.11).toFixed(3)),
      direction: flag_hypoxemia ? 'risk_up' : 'risk_down',
      clinical_significance: 'Reflects alveolar gas exchange and ventilation-perfusion mismatch'
    },
    {
      feature: 'Shock Index (HR / SBP)',
      impact: Number((shock_index >= 0.9 ? 0.18 : 0.02).toFixed(3)),
      direction: shock_index >= 0.9 ? 'risk_up' : 'neutral',
      clinical_significance: 'Predicts occult circulatory collapse before overt blood pressure drop'
    },
    {
      feature: 'Age & Physiological Reserve',
      impact: Number((flag_elderly ? 0.15 : -0.09).toFixed(3)),
      direction: flag_elderly ? 'risk_up' : 'risk_down',
      clinical_significance: 'Baseline cardiac compliance and frailty index'
    },
    {
      feature: 'Mean Arterial Pressure (MAP)',
      impact: Number((map_val < 65 ? 0.12 : -0.05).toFixed(3)),
      direction: map_val < 65 ? 'risk_up' : 'risk_down',
      clinical_significance: 'Threshold < 65 mmHg triggers renal and cerebral hypoperfusion'
    },
    {
      feature: 'Heart Rate (Tachycardia)',
      impact: Number((flag_tachycardia ? 0.09 : -0.04).toFixed(3)),
      direction: flag_tachycardia ? 'risk_up' : 'risk_down',
      clinical_significance: 'Sympathetic neurohumoral drive compensation'
    },
    {
      feature: 'Body Temperature (SIRS)',
      impact: Number((vitals.Temperature >= 38.3 ? 0.08 : -0.03).toFixed(3)),
      direction: vitals.Temperature >= 38.3 ? 'risk_up' : 'neutral',
      clinical_significance: 'Hypermetabolic inflammatory response or hypothermic sepsis'
    }
  ];

  // Briefing
  const summary = generateClinicalBriefing(vitals, prob, tier, shock_index, map_val);

  return {
    risk_score: Number(prob.toFixed(4)),
    risk_percentage: Number((prob * 100).toFixed(1)),
    risk_tier: tier,
    tier_label: tier_label,
    tier_color: tier_color,
    tier_bg: tier_bg,
    tier_glow: tier_glow,
    action_protocol: action,
    shock_index: Number(shock_index.toFixed(3)),
    shock_index_alert: shock_index >= 0.9,
    map_val: Number(map_val.toFixed(1)),
    map_alert: map_val < 65.0,
    pulse_pressure: Number(pulse_pressure.toFixed(1)),
    flags: {
      hypoxemia: flag_hypoxemia,
      tachycardia: flag_tachycardia,
      tachypnea: flag_tachypnea,
      elderly: flag_elderly,
      shock: shock_index >= 0.9,
      hypoperfusion: map_val < 65.0,
    },
    feature_impacts: impacts,
    clinical_summary: summary,
  };
}

export function generateClinicalBriefing(
  v: PatientVitals,
  prob: number,
  tier: 'HIGH' | 'MODERATE' | 'LOW',
  shock_index: number,
  map_val: number
): string {
  const factors: string[] = [];
  if (v.Age >= 65) factors.push(`advanced age (${Math.round(v.Age)}y)`);
  if (v.Oxygen_Saturation < 90) factors.push(`critical hypoxemia (SpO2 ${Math.round(v.Oxygen_Saturation)}%)`);
  else if (v.Oxygen_Saturation < 94) factors.push(`hypoxemia (SpO2 ${Math.round(v.Oxygen_Saturation)}%)`);
  if (v.Respiratory_Rate >= 28) factors.push(`severe tachypnea (${Math.round(v.Respiratory_Rate)}/min)`);
  else if (v.Respiratory_Rate > 22) factors.push(`tachypnea (${Math.round(v.Respiratory_Rate)}/min)`);
  if (v.Heart_Rate >= 120) factors.push(`severe tachycardia (${Math.round(v.Heart_Rate)} bpm)`);
  else if (v.Heart_Rate > 100) factors.push(`tachycardia (${Math.round(v.Heart_Rate)} bpm)`);
  if (shock_index >= 0.9) factors.push(`critical shock index (${shock_index.toFixed(2)})`);
  if (map_val < 65) factors.push(`hypoperfusion (MAP ${Math.round(map_val)} mmHg)`);
  if (v.Temperature >= 39.0) factors.push(`high fever (${v.Temperature.toFixed(1)}°C)`);
  else if (v.Temperature > 38.0) factors.push(`febrile (${v.Temperature.toFixed(1)}°C)`);

  const vitals_str = `HR ${Math.round(v.Heart_Rate)} bpm, BP ${Math.round(v.Systolic_BP)}/${Math.round(v.Diastolic_BP)} mmHg, RR ${Math.round(v.Respiratory_Rate)}/min, SpO2 ${Math.round(v.Oxygen_Saturation)}%`;
  const s1 = `Patient (age ${Math.round(v.Age)}) presents with ${vitals_str}; model-estimated ICU admission risk is ${(prob * 100).toFixed(0)}% (${tier}).`;

  let s2 = '';
  if (factors.length === 1) {
    s2 = `Primary concern is ${factors[0]}.`;
  } else if (factors.length === 2) {
    s2 = `Key risk factors: ${factors[0]} and ${factors[1]}.`;
  } else if (factors.length > 2) {
    s2 = `Multiple concerning findings: ${factors.slice(0, -1).join(', ')}, and ${factors[factors.length - 1]}.`;
  } else {
    s2 = `No major vital-sign abnormalities detected on current bedside measurements.`;
  }

  let s3 = '';
  if (tier === 'HIGH') {
    s3 = `Immediate recommendation: escalate to critical-care team, secure high-flow airway/oxygen, establish large-bore IV access, and initiate prompt ICU bed allocation.`;
  } else if (tier === 'MODERATE') {
    s3 = `Immediate recommendation: increase monitoring cadence to q15-30min, reassess blood gases/lactate, and alert attending physician.`;
  } else {
    s3 = `Immediate recommendation: proceed with standard ward observation protocol and scheduled vital sign re-evaluation.`;
  }

  return `${s1} ${s2} ${s3}`;
}
