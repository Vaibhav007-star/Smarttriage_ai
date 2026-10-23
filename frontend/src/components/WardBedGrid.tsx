import React from 'react';
import { BedDouble, CheckCircle2, UserCheck, AlertOctagon, UserX, Plus } from 'lucide-react';
import type { BedAllocation, TriageQueueItem } from '../types';

interface WardBedGridProps {
  beds: BedAllocation[];
  onToggleBed: (bedId: number) => void;
  queue: TriageQueueItem[];
  onAssignFromQueue: (queueItem: TriageQueueItem) => void;
  onRemoveQueueItem: (id: string) => void;
}

export const WardBedGrid: React.FC<WardBedGridProps> = ({
  beds,
  onToggleBed,
  queue,
  onAssignFromQueue,
  onRemoveQueueItem,
}) => {
  const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
  const availableCount = beds.length - occupiedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Telemetry Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BedDouble size={22} color="#38bdf8" />
              Emergency ICU 25-Bed Spatial Grid
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Real-time bed allocation telemetry, surge queue, and critical care transfer assignments.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupancy Rate</div>
              <div className="mono-num" style={{ fontSize: 22, fontWeight: 800, color: occupiedCount >= 22 ? '#ef4444' : '#f59e0b' }}>
                {Math.round((occupiedCount / beds.length) * 100)}%
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: 12,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(6, 9, 19, 0.7)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>OCCUPIED</div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                  {occupiedCount}
                </div>
              </div>
              <div style={{ width: 1, background: 'var(--border-subtle)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>AVAILABLE</div>
                <div className="mono-num" style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>
                  {availableCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 25 Beds */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 14,
        }}>
          {beds.map((bed) => {
            const isOccupied = bed.status === 'occupied';
            return (
              <div
                key={bed.bed_id}
                onClick={() => onToggleBed(bed.bed_id)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: isOccupied ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: isOccupied ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono-num" style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>
                    {bed.bed_label}
                  </span>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isOccupied ? '#ef4444' : '#10b981',
                    boxShadow: isOccupied ? '0 0 8px #ef4444' : '0 0 8px #10b981',
                  }} />
                </div>

                <div style={{ fontSize: 11, color: isOccupied ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                  {isOccupied ? (bed.patient_name || 'Active Patient') : 'Free Bed'}
                </div>

                <div style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  marginTop: 'auto',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 6,
                }}>
                  {isOccupied ? 'Click to Discharge' : 'Click to Reserve'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Triage Queue Waiting for ICU Beds */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertOctagon size={20} color="#f59e0b" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
              Bed Assignment Waiting Queue ({queue.length})
            </h3>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Patients triaged via ER Decision Cockpit
          </span>
        </div>

        {queue.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 16px',
            color: 'var(--text-muted)',
            fontSize: 13,
            border: '1px dashed var(--border-subtle)',
            borderRadius: 12,
          }}>
            No patients currently waiting in queue. Use the Triage Cockpit to evaluate and enqueue patients.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {queue.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{item.patient_name}</span>
                    <span className="vital-chip" style={{
                      color: item.prediction.tier_color,
                      background: item.prediction.tier_bg,
                    }}>
                      {item.prediction.tier_label} ({item.prediction.risk_percentage}%)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    MRN: {item.patient_mrn} • HR: {item.vitals.Heart_Rate} bpm • SBP: {item.vitals.Systolic_BP} mmHg • SpO2: {item.vitals.Oxygen_Saturation}% • Enqueued: {item.timestamp}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onAssignFromQueue(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '7px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <UserCheck size={14} />
                    <span>Assign Next Free Bed</span>
                  </button>
                  <button
                    onClick={() => onRemoveQueueItem(item.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      padding: '7px 10px',
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <UserX size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
