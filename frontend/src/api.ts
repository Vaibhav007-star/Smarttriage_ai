import { computeClientRiskPrediction } from './clinicalEngine';
import type { PatientRecord, PatientVitals, RiskPrediction } from './types';

export async function fetchRiskPrediction(vitals: PatientVitals): Promise<RiskPrediction> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitals),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    // Graceful offline / static fallback
  }

  // Instant zero-latency high-precision client calculation
  return computeClientRiskPrediction(vitals);
}

export async function fetchSamplePatients(): Promise<PatientRecord[]> {
  try {
    const res = await fetch('/data/patients.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch /data/patients.json', err);
  }

  // Fallback to API if hosted
  try {
    const res = await fetch('/api/patients');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch /api/patients', err);
  }

  return [];
}

export async function fetchModelMetrics(): Promise<any> {
  try {
    const res = await fetch('/data/model_metrics.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch /data/model_metrics.json', err);
  }
  return null;
}
