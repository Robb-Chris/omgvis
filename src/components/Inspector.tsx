import React from 'react';
import { useStore } from '../store/useStore';
import { factorize, evaluatePowerBase } from '../engine/MathEngine';
import { Zap, X } from 'lucide-react';

export const Inspector: React.FC = () => {
  const selectedN = useStore((state) => state.selectedN);
  const hoveredN = useStore((state) => state.hoveredN);
  const setSelectedN = useStore((state) => state.setSelectedN);
  const omegaData = useStore((state) => state.omegaData);

  const currentN = selectedN ?? hoveredN;

  if (currentN === null || !omegaData || currentN >= omegaData.length) {
    return null;
  }

  const omega = omegaData[currentN];
  const factors = factorize(currentN);
  const powerInfo = evaluatePowerBase(currentN, factors);

  // Classification label
  let classification = 'Composite';
  let badgeColor = '#9D00FF';

  if (currentN === 1) {
    classification = 'Unity (1)';
    badgeColor = '#FFFFFF';
  } else if (omega === 1) {
    classification = 'Prime';
    badgeColor = '#00F3FF';
  } else if (omega === 2) {
    classification = 'Semiprime';
    badgeColor = '#00FF88';
  } else if (omega === 3) {
    badgeColor = '#FFD000';
  } else if (omega === 4) {
    badgeColor = '#FF2A6D';
  }

  if (powerInfo.isPowerBase) {
    classification += ' · Perfect Power';
  }

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 10,
        width: 300,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Integer Inspector</div>
        {selectedN !== null && (
          <button
            onClick={() => setSelectedN(null)}
            className="btn-pill"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Main Integer & Depth Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)' }}>
          {currentN.toLocaleString()}
        </div>
        <div
          style={{
            background: badgeColor,
            color: '#000',
            fontFamily: 'Outfit',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Ω = {omega}
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{classification}</div>

      {/* Power Base Info */}
      {powerInfo.isPowerBase && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 208, 0, 0.12)',
            border: '1px solid rgba(255, 208, 0, 0.3)',
            fontSize: '0.78rem',
            color: '#FFD000',
          }}
        >
          <Zap size={14} />
          <span>
            N = {powerInfo.base}
            <sup style={{ marginLeft: 1 }}>{powerInfo.exponent}</sup>
          </span>
        </div>
      )}

      {/* Factorization */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: 6 }}>
          Prime Factorization
        </div>

        {currentN === 1 ? (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>1 has no prime factors</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {factors.map((f: { factor: number; count: number }, i: number) => (
              <React.Fragment key={f.factor}>
                {i > 0 && <span style={{ color: 'var(--text-3)' }}>×</span>}
                <span
                  style={{
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontFamily: 'Outfit',
                  }}
                >
                  {f.factor}
                  {f.count > 1 && <sup style={{ color: 'var(--accent)', marginLeft: 1 }}>{f.count}</sup>}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
