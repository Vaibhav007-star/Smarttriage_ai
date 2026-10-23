import React from 'react';
import { Activity, AlertTriangle, BedDouble, Database, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'cockpit' | 'beds' | 'cohort' | 'model';
  setActiveTab: (tab: 'cockpit' | 'beds' | 'cohort' | 'model') => void;
  occupiedBeds: number;
  totalBeds: number;
  queueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  occupiedBeds,
  totalBeds,
  queueCount,
}) => {
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(6, 9, 19, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
          }}>
            <Activity size={26} color="#ffffff" className="pulse-heart" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                SmartTriage <span style={{ color: '#38bdf8' }}>AI</span>
              </h1>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                padding: '2px 7px',
                borderRadius: 4,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}>
                v2.4 PROD
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Predictive ICU Risk Engine & Clinical Briefing Cockpit
            </p>
          </div>
        </div>

        {/* Live Hospital Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Bed Occupancy Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
          }}>
            <BedDouble size={18} color="#38bdf8" />
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ICU Bed Telemetry
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: availableBeds <= 2 ? '#ef4444' : '#10b981' }}>{availableBeds} Free</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{totalBeds} Total</span>
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  color: occupancyRate > 85 ? '#ef4444' : '#f59e0b',
                  fontWeight: 600,
                }}>
                  ({occupancyRate}% Occ)
                </span>
              </div>
            </div>
          </div>

          {/* Active Queue Badge */}
          {queueCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <AlertTriangle size={16} color="#ef4444" />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>
                <span className="mono-num" style={{ fontWeight: 800 }}>{queueCount}</span> in Triage Queue
              </div>
            </div>
          )}

          {/* SaMD badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: 11,
            color: '#34d399',
            fontFamily: 'var(--font-mono)',
          }}>
            <ShieldCheck size={14} />
            <span>SaMD Decision Support</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.9)',
          padding: 4,
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          gap: 4,
        }}>
          <button
            onClick={() => setActiveTab('cockpit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'cockpit' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'cockpit' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity size={15} />
            <span>Triage Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab('beds')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'beds' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'beds' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <BedDouble size={15} />
            <span>ICU Ward Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('cohort')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'cohort' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'cohort' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Database size={15} />
            <span>384 Patient Cohort</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === 'model' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: activeTab === 'model' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Cpu size={15} />
            <span>Model Intelligence</span>
          </button>
        </div>
      </div>
    </header>
  );
};
