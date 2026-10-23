import React from 'react';
import {
  Heart,
  Gauge,
  Wind,
  Droplets,
  Thermometer,
  User,
  AlertCircle,
  Zap,
  TrendingUp,
  RefreshCw,
  Shuffle
} from 'lucide-react';
import { CLINICAL_PRESETS, getVitalStatus } from '../clinicalEngine';
import type { ClinicalPreset, PatientVitals, RiskPrediction } from '../types';

interface TriageCockpitProps {
  vitals: PatientVitals;
  setVitals: React.Dispatch<React.SetStateAction<PatientVitals>>;
  prediction: RiskPrediction;
  onSelectPreset: (preset: ClinicalPreset) => void;
  activePresetId: string | null;
  onRandomCohortPatient: () => void;
}

export const TriageCockpit: React.FC<TriageCockpitProps> = ({
  vitals,
  setVitals,
  prediction,
  onSelectPreset,
  activePresetId,
  onRandomCohortPatient,
}) => {
  const updateVital = (key: keyof PatientVitals, val: number) => {
    setVitals((prev) => ({ ...prev, [key]: val }));
  };

  const hrStatus = getVitalStatus('Heart_Rate', vitals.Heart_Rate);
  const sbpStatus = getVitalStatus('Systolic_BP', vitals.Systolic_BP);
  const dbpStatus = getVitalStatus('Diastolic_BP', vitals.Diastolic_BP);
  const rrStatus = getVitalStatus('Respiratory_Rate', vitals.Respiratory_Rate);
  const spo2Status = getVitalStatus('Oxygen_Saturation', vitals.Oxygen_Saturation);
  const tempStatus = getVitalStatus('Temperature', vitals.Temperature);
  const ageStatus = getVitalStatus('Age', vitals.Age);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Clinical Presets Banner */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#38bdf8" />
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#e2e8f0' }}>
              Rapid ER Scenarios & Presets
            </h2>
          </div>
          <button
            onClick={onRandomCohortPatient}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '5px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Shuffle size={14} />
            <span>Load Real Sírio-Libanês Patient</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}>
          {CLINICAL_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    {preset.icon} {preset.name}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bedside Vitals Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {/* Heart Rate */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: hrStatus.isCritical ? 'rgba(239, 68, 68, 0.5)' : (hrStatus.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
          boxShadow: hrStatus.isCritical ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)' }}>
                <Heart size={18} color="#ef4444" className={vitals.Heart_Rate > 100 ? 'pulse-heart' : ''} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Heart Rate</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {hrStatus.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: hrStatus.color, background: hrStatus.bg }}>
              {hrStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Heart_Rate}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>bpm</span>
          </div>
          <input
            type="range"
            min={40}
            max={180}
            step={1}
            value={vitals.Heart_Rate}
            onChange={(e) => updateVital('Heart_Rate', Number(e.target.value))}
          />
        </div>

        {/* Systolic BP */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: sbpStatus.isCritical ? 'rgba(239, 68, 68, 0.5)' : (sbpStatus.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
          boxShadow: sbpStatus.isCritical ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)' }}>
                <Gauge size={18} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Systolic BP</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {sbpStatus.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: sbpStatus.color, background: sbpStatus.bg }}>
              {sbpStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Systolic_BP}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>mmHg</span>
          </div>
          <input
            type="range"
            min={60}
            max={220}
            step={1}
            value={vitals.Systolic_BP}
            onChange={(e) => updateVital('Systolic_BP', Number(e.target.value))}
          />
        </div>

        {/* Diastolic BP */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: dbpStatus.isCritical ? 'rgba(239, 68, 68, 0.5)' : (dbpStatus.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)' }}>
                <Gauge size={18} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Diastolic BP</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {dbpStatus.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: dbpStatus.color, background: dbpStatus.bg }}>
              {dbpStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Diastolic_BP}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>mmHg</span>
          </div>
          <input
            type="range"
            min={35}
            max={130}
            step={1}
            value={vitals.Diastolic_BP}
            onChange={(e) => updateVital('Diastolic_BP', Number(e.target.value))}
          />
        </div>

        {/* Respiratory Rate */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: rrStatus.isCritical ? 'rgba(239, 68, 68, 0.5)' : (rrStatus.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
          boxShadow: rrStatus.isCritical ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)' }}>
                <Wind size={18} color="#c084fc" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Respiratory Rate</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {rrStatus.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: rrStatus.color, background: rrStatus.bg }}>
              {rrStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Respiratory_Rate}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>/min</span>
          </div>
          <input
            type="range"
            min={8}
            max={48}
            step={1}
            value={vitals.Respiratory_Rate}
            onChange={(e) => updateVital('Respiratory_Rate', Number(e.target.value))}
          />
        </div>

        {/* Oxygen Saturation */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: spo2Status.isCritical ? 'rgba(239, 68, 68, 0.5)' : (spo2Status.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
          boxShadow: spo2Status.isCritical ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)' }}>
                <Droplets size={18} color="#06b6d4" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>SpO2 Saturation</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {spo2Status.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: spo2Status.color, background: spo2Status.bg }}>
              {spo2Status.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Oxygen_Saturation}%
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Room Air</span>
          </div>
          <input
            type="range"
            min={65}
            max={100}
            step={1}
            value={vitals.Oxygen_Saturation}
            onChange={(e) => updateVital('Oxygen_Saturation', Number(e.target.value))}
          />
        </div>

        {/* Temperature */}
        <div className="glass-panel" style={{
          padding: 18,
          borderColor: tempStatus.isCritical ? 'rgba(239, 68, 68, 0.5)' : (tempStatus.isAbnormal ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)' }}>
                <Thermometer size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Temperature</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ref: {tempStatus.ref}</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: tempStatus.color, background: tempStatus.bg }}>
              {tempStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Temperature.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>°C ({((vitals.Temperature * 9/5) + 32).toFixed(1)}°F)</span>
          </div>
          <input
            type="range"
            min={34.0}
            max={41.5}
            step={0.1}
            value={vitals.Temperature}
            onChange={(e) => updateVital('Temperature', Number(e.target.value))}
          />
        </div>

        {/* Age */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, borderRadius: 8, background: 'rgba(148, 163, 184, 0.15)' }}>
                <User size={18} color="#94a3b8" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>Patient Age</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Geriatric threshold: ≥65 y</div>
              </div>
            </div>
            <span className="vital-chip" style={{ color: ageStatus.color, background: ageStatus.bg }}>
              {ageStatus.chip}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>
              {vitals.Age}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>years</span>
          </div>
          <input
            type="range"
            min={18}
            max={95}
            step={1}
            value={vitals.Age}
            onChange={(e) => updateVital('Age', Number(e.target.value))}
          />
        </div>
      </div>

      {/* Derived Hemodynamic Biomarkers HUD */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 14, 26, 0.95) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <TrendingUp size={18} color="#38bdf8" />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Derived Hemodynamic Biomarkers (ICU Care Telemetry)
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {/* Shock Index */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: prediction.shock_index_alert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            border: prediction.shock_index_alert ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Shock Index (HR / SBP)</span>
              {prediction.shock_index_alert && (
                <span className="vital-chip" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)' }}>
                  OCCULT SHOCK ≥0.9
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: prediction.shock_index_alert ? '#ef4444' : '#ffffff' }}>
                {prediction.shock_index}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Normal: 0.5–0.7</span>
            </div>
          </div>

          {/* MAP */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: prediction.map_alert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
            border: prediction.map_alert ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Mean Arterial Pressure (MAP)</span>
              {prediction.map_alert && (
                <span className="vital-chip" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)' }}>
                  HYPOPERFUSION &lt;65
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: prediction.map_alert ? '#ef4444' : '#ffffff' }}>
                {prediction.map_val}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>mmHg (Target: ≥65)</span>
            </div>
          </div>

          {/* Pulse Pressure */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Pulse Pressure (SBP - DBP)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>
                {prediction.pulse_pressure}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>mmHg (Normal: 30–50)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
