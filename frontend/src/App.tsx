import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TriageCockpit } from './components/TriageCockpit';
import { RiskAssessmentCard } from './components/RiskAssessmentCard';
import { WardBedGrid } from './components/WardBedGrid';
import { CohortExplorer } from './components/CohortExplorer';
import { ModelIntelligence } from './components/ModelIntelligence';
import { CLINICAL_PRESETS, computeClientRiskPrediction } from './clinicalEngine';
import { fetchModelMetrics, fetchRiskPrediction, fetchSamplePatients } from './api';
import type { BedAllocation, ClinicalPreset, PatientRecord, PatientVitals, RiskPrediction, TriageQueueItem } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'beds' | 'cohort' | 'model'>('cockpit');

  // Default vitals start with Severe Septic Shock preset for immediate clinical demonstration
  const [vitals, setVitals] = useState<PatientVitals>(CLINICAL_PRESETS[0].vitals);
  const [activePresetId, setActivePresetId] = useState<string | null>(CLINICAL_PRESETS[0].id);

  // Computed prediction state
  const [prediction, setPrediction] = useState<RiskPrediction>(() => computeClientRiskPrediction(vitals));

  // 25 ICU Beds State (21 occupied, 4 available)
  const [beds, setBeds] = useState<BedAllocation[]>(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const isOccupied = i < 21;
      return {
        bed_id: i + 1,
        bed_label: `ICU-${(i + 1).toString().padStart(2, '0')}`,
        status: isOccupied ? 'occupied' : 'available',
        patient_name: isOccupied ? `Patient #${100 + i}` : undefined,
        risk_tier: isOccupied ? (i % 3 === 0 ? 'HIGH' : 'MODERATE') : undefined,
        admitted_at: isOccupied ? 'Today 06:30' : undefined,
      };
    });
  });

  // Triage queue for patients awaiting bed assignment
  const [queue, setQueue] = useState<TriageQueueItem[]>([]);

  // Cohort patients from JSON
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  // Load cohort data and metrics on mount
  useEffect(() => {
    fetchSamplePatients().then((data) => {
      if (data && data.length > 0) {
        setPatients(data);
      }
    });
    fetchModelMetrics().then((m) => {
      if (m) setMetrics(m);
    });
  }, []);

  // Update prediction whenever vitals change
  useEffect(() => {
    let isCurrent = true;
    fetchRiskPrediction(vitals).then((res) => {
      if (isCurrent) {
        setPrediction(res);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [vitals]);

  const handleSelectPreset = (preset: ClinicalPreset) => {
    setActivePresetId(preset.id);
    setVitals(preset.vitals);
  };

  const handleRandomCohortPatient = () => {
    if (patients.length === 0) return;
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    setActivePresetId(null);
    setVitals({
      Age: randomPatient.Age,
      Heart_Rate: Number(randomPatient.Heart_Rate.toFixed(1)),
      Systolic_BP: Number(randomPatient.Systolic_BP.toFixed(1)),
      Diastolic_BP: Number(randomPatient.Diastolic_BP.toFixed(1)),
      Respiratory_Rate: Number(randomPatient.Respiratory_Rate.toFixed(1)),
      Oxygen_Saturation: Number(randomPatient.Oxygen_Saturation.toFixed(1)),
      Temperature: Number(randomPatient.Temperature.toFixed(1)),
    });
  };

  const handleLoadPatientFromCohort = (patientVitals: PatientVitals) => {
    setActivePresetId(null);
    setVitals(patientVitals);
    setActiveTab('cockpit');
  };

  const handleAdmitToQueue = () => {
    const newItem: TriageQueueItem = {
      id: `TRG-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patient_mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
      patient_name: activePresetId
        ? CLINICAL_PRESETS.find((p) => p.id === activePresetId)?.name.split(' (')[0] || 'Triage Patient'
        : `Patient (Age ${vitals.Age})`,
      vitals: { ...vitals },
      prediction: { ...prediction },
      status: 'Triage Pending',
    };
    setQueue((prev) => [newItem, ...prev]);
  };

  const handleToggleBed = (bedId: number) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.bed_id === bedId) {
          const isOccupied = b.status === 'occupied';
          return {
            ...b,
            status: isOccupied ? 'available' : 'occupied',
            patient_name: isOccupied ? undefined : 'Admitted Bed',
          };
        }
        return b;
      })
    );
  };

  const handleAssignFromQueue = (queueItem: TriageQueueItem) => {
    const firstFreeBed = beds.find((b) => b.status === 'available');
    if (!firstFreeBed) {
      alert('Surge Alert: All 25 ICU beds are currently occupied! Transfer to partner facility required.');
      return;
    }

    setBeds((prev) =>
      prev.map((b) => {
        if (b.bed_id === firstFreeBed.bed_id) {
          return {
            ...b,
            status: 'occupied',
            patient_name: queueItem.patient_name,
            patient_id: queueItem.patient_mrn,
            risk_tier: queueItem.prediction.risk_tier,
            admitted_at: 'Just now',
          };
        }
        return b;
      })
    );

    // Remove from queue
    setQueue((prev) => prev.filter((item) => item.id !== queueItem.id));
  };

  const handleRemoveQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        occupiedBeds={occupiedBeds}
        totalBeds={beds.length}
        queueCount={queue.length}
      />

      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 20px 60px' }}>
        {activeTab === 'cockpit' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)',
            gap: 24,
            alignItems: 'start',
          }}>
            <TriageCockpit
              vitals={vitals}
              setVitals={setVitals}
              prediction={prediction}
              onSelectPreset={handleSelectPreset}
              activePresetId={activePresetId}
              onRandomCohortPatient={handleRandomCohortPatient}
            />

            <RiskAssessmentCard
              prediction={prediction}
              vitals={vitals}
              onAdmitToQueue={handleAdmitToQueue}
            />
          </div>
        )}

        {activeTab === 'beds' && (
          <WardBedGrid
            beds={beds}
            onToggleBed={handleToggleBed}
            queue={queue}
            onAssignFromQueue={handleAssignFromQueue}
            onRemoveQueueItem={handleRemoveQueueItem}
          />
        )}

        {activeTab === 'cohort' && (
          <CohortExplorer
            patients={patients}
            onLoadPatientIntoCockpit={handleLoadPatientFromCohort}
          />
        )}

        {activeTab === 'model' && (
          <ModelIntelligence metrics={metrics} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted)',
        background: 'rgba(6, 9, 19, 0.9)',
      }}>
        SmartTriage AI — Hospital Sírio-Libanês Clinical Cohort Decision Engine • Powered by XGBoost & Evidence-Based Clinical Telemetry
      </footer>
    </div>
  );
}

export default App;
