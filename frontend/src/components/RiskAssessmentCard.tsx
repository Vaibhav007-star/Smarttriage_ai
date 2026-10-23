import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  PlusCircle,
  Share2,
  ShieldAlert,
  Sparkles,
  Zap
} from 'lucide-react';
import type { PatientVitals, RiskPrediction } from '../types';

interface RiskAssessmentCardProps {
  prediction: RiskPrediction;
  vitals: PatientVitals;
  onAdmitToQueue: () => void;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  prediction,
  vitals,
  onAdmitToQueue,
}) => {
  const [copied, setCopied] = useState(false);
  const [admittedSuccess, setAdmittedSuccess] = useState(false);

  const copyBriefing = () => {
    navigator.clipboard.writeText(prediction.clinical_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdmit = () => {
    onAdmitToQueue();
    setAdmittedSuccess(true);
    setTimeout(() => setAdmittedSuccess(false), 3000);
  };

  // SVG Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prediction.risk_percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Primary Score & Tier Hero Card */}
      <div className="glass-panel" style={{
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${prediction.tier_color}60`,
        boxShadow: prediction.tier_glow,
      }}>
        {/* Background glow orb */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: prediction.tier_color,
          opacity: 0.15,
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} color={prediction.tier_color} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Calibrated ICU Admission Probability
            </span>
          </div>
          <span className="vital-chip" style={{
            color: prediction.tier_color,
            background: prediction.tier_bg,
            border: `1px solid ${prediction.tier_color}40`,
            padding: '4px 10px',
            fontSize: 12,
          }}>
            {prediction.tier_label}
          </span>
        </div>

        {/* Hero Gauge & Risk readout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 20,
          padding: '10px 0',
        }}>
          {/* Circular SVG Gauge */}
          <div style={{ position: 'relative', width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={170} height={170} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx={85}
                cy={85}
                r={radius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={14}
                fill="none"
              />
              {/* Progress arc */}
              <circle
                cx={85}
                cy={85}
                r={radius}
                stroke={prediction.tier_color}
                strokeWidth={14}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                  filter: `drop-shadow(0 0 8px ${prediction.tier_color})`,
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="mono-num" style={{ fontSize: 38, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {prediction.risk_percentage}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
                ICU Risk
              </span>
            </div>
          </div>

          {/* Protocolized Immediate Action */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Mandatory Triage Protocol
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.45,
              marginBottom: 14,
            }}>
              {prediction.action_protocol}
            </div>

            <button
              onClick={handleAdmit}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: admittedSuccess
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : (prediction.risk_tier === 'HIGH'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #0284c7, #2563eb)'),
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: admittedSuccess
                  ? '0 0 16px rgba(16, 185, 129, 0.5)'
                  : '0 0 20px rgba(2, 132, 199, 0.35)',
              }}
            >
              {admittedSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Enqueued to Bed Queue!</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Admit Patient to Triage Queue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Attribution Waterfall Chart */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={17} color="#38bdf8" />
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#e2e8f0' }}>
              Biomarker Attribution Waterfall
            </h3>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            XGBoost Gradient Tree Weights
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prediction.feature_impacts.map((item, idx) => {
            const isRiskUp = item.direction === 'risk_up';
            const barWidth = Math.min(100, Math.abs(item.impact) * 260);
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{item.feature}</span>
                  <span className="mono-num" style={{
                    color: isRiskUp ? '#ef4444' : '#10b981',
                    fontWeight: 700,
                  }}>
                    {isRiskUp ? `+${item.impact}` : `${item.impact}`}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: isRiskUp ? '#ef4444' : '#10b981',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Clinical Briefing (GenAI SBAR) */}
      <div className="glass-panel" style={{ padding: 20, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={17} color="#38bdf8" />
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#38bdf8' }}>
              Automated Clinical Briefing (SBAR)
            </h3>
          </div>
          <button
            onClick={copyBriefing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy SBAR'}</span>
          </button>
        </div>

        <div style={{
          background: 'rgba(6, 9, 19, 0.65)',
          padding: 14,
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          fontSize: 13,
          lineHeight: 1.6,
          color: '#e2e8f0',
          fontFamily: 'var(--font-sans)',
        }}>
          {prediction.clinical_summary}
        </div>
      </div>
    </div>
  );
};
