import React from 'react';
import { Cpu, ShieldCheck, CheckCircle2, TrendingUp, BarChart2, Award, AlertCircle } from 'lucide-react';

interface ModelIntelligenceProps {
  metrics: any;
}

export const ModelIntelligence: React.FC<ModelIntelligenceProps> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Card */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Cpu size={22} color="#38bdf8" />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                XGBoost GPU-Accelerated Clinical Pipeline Architecture
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Trained on Hospital Sírio-Libanês triage cohort using NVIDIA CUDA histogram gradient boosting with Scikit-Learn custom pipeline encapsulation.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}>
            <Award size={16} />
            <span>ROC-AUC 0.8009 (Holdout Test)</span>
          </div>
        </div>

        {/* Core Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginTop: 20,
        }}>
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TEST ROC-AUC</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>0.8009</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>+6.0% over legacy baseline</div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>5-FOLD CV ROC-AUC</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>0.7576</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>±0.0437 cross-validation</div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TEST PRECISION</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>77.1%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Low false ICU alarms</div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TEST RECALL (SENSITIVITY)</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>69.2%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Critical patient catch rate</div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>OVERALL ACCURACY</div>
            <div className="mono-num" style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>74.0%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>N=77 unseen test patients</div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Calibration Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Confusion Matrix */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} color="#38bdf8" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
              Holdout Test Set Confusion Matrix (N = 77)
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            maxWidth: 360,
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Negatives (TN)</div>
              <div className="mono-num" style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>30</div>
              <div style={{ fontSize: 11, color: '#86efac' }}>Correctly Non-ICU</div>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Positives (FP)</div>
              <div className="mono-num" style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>8</div>
              <div style={{ fontSize: 11, color: '#fde68a' }}>Over-triaged to ICU</div>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>False Negatives (FN)</div>
              <div className="mono-num" style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>12</div>
              <div style={{ fontSize: 11, color: '#fca5a5' }}>Delayed ICU Escalation</div>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>True Positives (TP)</div>
              <div className="mono-num" style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8' }}>27</div>
              <div style={{ fontSize: 11, color: '#bae6fd' }}>Correctly Identified ICU</div>
            </div>
          </div>
        </div>

        {/* Clinical Safety & Regulatory Framework */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={18} color="#10b981" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
              SaMD Regulatory Framing & Clinical Guardrails
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <p>
              • <strong>Clinical Intended Use</strong>: Software as a Medical Device (SaMD) Class II emergency department clinical decision-support tool designed to augment triage nurse workflow within the first 15 minutes of presentation.
            </p>
            <p>
              • <strong>Zero Data Leakage Validation</strong>: Replaced target-conditioned imputation with strict temporal patient trajectory aggregation. All biomarker transformations (Shock Index, MAP, pulse pressure) are calculated strictly on admission vital signs.
            </p>
            <p>
              • <strong>Clinician-in-the-Loop</strong>: Model probabilities must be paired with clinical examination and physician judgment before definitive bed allocation or discharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
