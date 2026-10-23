export interface PatientVitals {
  Age: number;
  Heart_Rate: number;
  Systolic_BP: number;
  Diastolic_BP: number;
  Respiratory_Rate: number;
  Oxygen_Saturation: number;
  Temperature: number;
}

export interface VitalStatus {
  chip: string;
  color: string;
  bg: string;
  ref: string;
  isAbnormal: boolean;
  isCritical: boolean;
}

export interface FeatureImpact {
  feature: string;
  impact: number;
  direction: 'risk_up' | 'risk_down' | 'neutral';
  clinical_significance?: string;
}

export interface RiskPrediction {
  risk_score: number;
  risk_percentage: number;
  risk_tier: 'HIGH' | 'MODERATE' | 'LOW';
  tier_label: string;
  tier_color: string;
  tier_bg: string;
  tier_glow: string;
  action_protocol: string;
  shock_index: number;
  shock_index_alert: boolean;
  map_val: number;
  map_alert: boolean;
  pulse_pressure: number;
  flags: {
    hypoxemia: boolean;
    tachycardia: boolean;
    tachypnea: boolean;
    elderly: boolean;
    shock: boolean;
    hypoperfusion: boolean;
  };
  feature_impacts: FeatureImpact[];
  clinical_summary: string;
}

export interface ClinicalPreset {
  id: string;
  name: string;
  icon: string;
  badge: string;
  description: string;
  vitals: PatientVitals;
}

export interface PatientRecord {
  Patient_ID: number;
  Age: number;
  Gender: number;
  Heart_Rate: number;
  Systolic_BP: number;
  Diastolic_BP: number;
  Respiratory_Rate: number;
  Oxygen_Saturation: number;
  Temperature: number;
  Shock_Index: number;
  MAP: number;
  Pulse_Pressure: number;
  Requires_ICU: number;
}

export interface BedAllocation {
  bed_id: number;
  bed_label: string;
  status: 'occupied' | 'available' | 'reserved';
  patient_id?: string;
  patient_name?: string;
  risk_tier?: 'HIGH' | 'MODERATE' | 'LOW';
  admitted_at?: string;
}

export interface TriageQueueItem {
  id: string;
  timestamp: string;
  patient_mrn: string;
  patient_name: string;
  vitals: PatientVitals;
  prediction: RiskPrediction;
  status: 'Triage Pending' | 'ICU Admitted' | 'Step-Down Monitored' | 'Discharged';
}
