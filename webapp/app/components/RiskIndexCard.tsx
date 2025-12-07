'use client';

import React from 'react';

type Props = {
  symbol?: string;
  riskIndex: number; // expected in range 0.0 (low) .. 1.0 (high)
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function interpolateRiskColor(value: number) {
  // interpolate between green (#4CAF50 -> rgb(76,175,80)) at 0.0
  // and red (#F44336 -> rgb(244,67,54)) at 1.0
  const v = clamp01(value);
  const r = Math.round(244 * v + 76 * (1 - v));
  const g = Math.round(67 * v + 175 * (1 - v));
  const b = Math.round(54 * v + 80 * (1 - v));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function RiskIndexCard({ symbol, riskIndex }: Props) {
  const val = clamp01(riskIndex);
  const color = interpolateRiskColor(val);

  function formatDecimal(v: number) {
    // show up to 2 decimal places but trim trailing zeros: 0.7 -> "0.7", 1.0 -> "1"
    const s = v.toFixed(2);
    return s.replace(/\.?0+$/, '');
  }

  return (
    <div
      role="group"
      aria-label={`Risk index for ${symbol ?? 'symbol'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.04)',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: 16, color: '#111', fontWeight: 700 }}>{symbol ?? 'RISK'}</span>
        <span style={{ fontSize: 11, color: '#666' }}>risk</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 140,
            height: 14,
            background: '#eee',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.round(val * 100)}%`,
              height: '100%',
              background: color,
              transition: 'width 220ms ease, background 220ms ease',
            }}
          />
        </div>

        <div style={{ minWidth: 44, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 12, color: '#111', fontWeight: 700 }}>{formatDecimal(val)}</span>
        </div>
      </div>
    </div>
  );
}