import React, { useState } from 'react';
import { Database, Search, Filter, ArrowUpRight, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import type { PatientRecord, PatientVitals } from '../types';

interface CohortExplorerProps {
  patients: PatientRecord[];
  onLoadPatientIntoCockpit: (vitals: PatientVitals) => void;
}

export const CohortExplorer: React.FC<CohortExplorerProps> = ({
  patients,
  onLoadPatientIntoCockpit,
}) => {
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'icu' | 'no_icu'>('all');
  const [shockFilter, setShockFilter] = useState<'all' | 'shock'>('all');

  const filtered = patients.filter((p) => {
    if (search && !p.Patient_ID.toString().includes(search)) return false;
    if (outcomeFilter === 'icu' && p.Requires_ICU !== 1) return false;
    if (outcomeFilter === 'no_icu' && p.Requires_ICU !== 0) return false;
    if (shockFilter === 'shock' && p.Shock_Index < 0.9) return false;
    return true;
  });

  const totalCohort = patients.length;
  const icuAdmissions = patients.filter((p) => p.Requires_ICU === 1).length;
  const icuRate = totalCohort > 0 ? Math.round((icuAdmissions / totalCohort) * 100) : 0;
  const shockCount = patients.filter((p) => p.Shock_Index >= 0.9).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Cohort Metrics */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={22} color="#38bdf8" />
              Hospital Sírio-Libanês Clinical Cohort (São Paulo)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              384 authentic emergency presentation visits with zero-leakage vital telemetry and ICU outcome ground truth.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(6, 9, 19, 0.7)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TOTAL COHORT</div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>{totalCohort} Patients</div>
            </div>
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(6, 9, 19, 0.7)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ICU ADMITTED</div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{icuAdmissions} ({icuRate}%)</div>
            </div>
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(6, 9, 19, 0.7)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>OCCULT SHOCK (≥0.9)</div>
              <div className="mono-num" style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{shockCount} Cases</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-subtle)',
            padding: '7px 12px',
            borderRadius: 8,
            flex: '1 1 200px',
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by Patient ID (e.g. 0 to 383)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setOutcomeFilter('all')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: outcomeFilter === 'all' ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                background: outcomeFilter === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: outcomeFilter === 'all' ? '#38bdf8' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Outcomes
            </button>
            <button
              onClick={() => setOutcomeFilter('icu')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: outcomeFilter === 'icu' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: outcomeFilter === 'icu' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: outcomeFilter === 'icu' ? '#ef4444' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ICU Admitted Only
            </button>
            <button
              onClick={() => setOutcomeFilter('no_icu')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: outcomeFilter === 'no_icu' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: outcomeFilter === 'no_icu' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: outcomeFilter === 'no_icu' ? '#10b981' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Non-ICU Discharges
            </button>
          </div>

          <button
            onClick={() => setShockFilter(shockFilter === 'all' ? 'shock' : 'all')}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: shockFilter === 'shock' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
              background: shockFilter === 'shock' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: shockFilter === 'shock' ? '#f59e0b' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Shock Index ≥ 0.9
          </button>
        </div>
      </div>

      {/* Cohort Records Table */}
      <div className="glass-panel" style={{ padding: 20, overflowX: 'auto' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Showing {filtered.length} of {patients.length} patient records. Click "Load Patient" to test model triage response.
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '10px 12px' }}>ID</th>
              <th style={{ padding: '10px 12px' }}>Age</th>
              <th style={{ padding: '10px 12px' }}>Heart Rate</th>
              <th style={{ padding: '10px 12px' }}>Blood Pressure</th>
              <th style={{ padding: '10px 12px' }}>RR</th>
              <th style={{ padding: '10px 12px' }}>SpO2</th>
              <th style={{ padding: '10px 12px' }}>Temp</th>
              <th style={{ padding: '10px 12px' }}>Shock Index</th>
              <th style={{ padding: '10px 12px' }}>Ground Truth</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 40).map((patient) => {
              const isICU = patient.Requires_ICU === 1;
              return (
                <tr
                  key={patient.Patient_ID}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="mono-num" style={{ padding: '10px 12px', fontWeight: 700, color: '#38bdf8' }}>
                    #{patient.Patient_ID}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#f8fafc' }}>{patient.Age} y</td>
                  <td className="mono-num" style={{ padding: '10px 12px', color: patient.Heart_Rate > 100 ? '#ef4444' : '#f8fafc' }}>
                    {patient.Heart_Rate.toFixed(1)} bpm
                  </td>
                  <td className="mono-num" style={{ padding: '10px 12px', color: '#f8fafc' }}>
                    {patient.Systolic_BP.toFixed(0)} / {patient.Diastolic_BP.toFixed(0)}
                  </td>
                  <td className="mono-num" style={{ padding: '10px 12px', color: patient.Respiratory_Rate > 22 ? '#ef4444' : '#f8fafc' }}>
                    {patient.Respiratory_Rate.toFixed(1)}
                  </td>
                  <td className="mono-num" style={{ padding: '10px 12px', color: patient.Oxygen_Saturation < 94 ? '#ef4444' : '#f8fafc' }}>
                    {patient.Oxygen_Saturation.toFixed(1)}%
                  </td>
                  <td className="mono-num" style={{ padding: '10px 12px', color: '#f8fafc' }}>
                    {patient.Temperature.toFixed(1)}°C
                  </td>
                  <td className="mono-num" style={{
                    padding: '10px 12px',
                    fontWeight: 700,
                    color: patient.Shock_Index >= 0.9 ? '#ef4444' : '#10b981',
                  }}>
                    {patient.Shock_Index.toFixed(3)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="vital-chip" style={{
                      color: isICU ? '#ef4444' : '#10b981',
                      background: isICU ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    }}>
                      {isICU ? 'ADMITTED ICU' : 'NON-ICU WARD'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => onLoadPatientIntoCockpit({
                        Age: patient.Age,
                        Heart_Rate: Number(patient.Heart_Rate.toFixed(1)),
                        Systolic_BP: Number(patient.Systolic_BP.toFixed(1)),
                        Diastolic_BP: Number(patient.Diastolic_BP.toFixed(1)),
                        Respiratory_Rate: Number(patient.Respiratory_Rate.toFixed(1)),
                        Oxygen_Saturation: Number(patient.Oxygen_Saturation.toFixed(1)),
                        Temperature: Number(patient.Temperature.toFixed(1)),
                      })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Load into Cockpit</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
