import { useMemo } from 'react';
import type { Supply } from '../types';

interface Props { supply: Supply; }

export function ConsumoTab({ supply }: Props) {
  const lastConsumption = supply.consumption?.[supply.consumption.length - 1];
  const totals = useMemo(
    () => supply.consumption?.map((c) => Number(c.totalKwh)) ?? [],
    [supply],
  );
  const hourly = (lastConsumption?.hourlyProfile as number[]) ?? new Array(24).fill(0);
  const nowHour = new Date().getHours();

  // Polyline points for monthly trend
  const M = Math.max(...totals, 1);
  const m = Math.min(...totals, 0);
  const points = totals
    .map((v, i) => `${(i / (totals.length - 1 || 1)) * 200},${70 - ((v - m) / (M - m || 1)) * 70}`)
    .join(' ');

  // Radial chart geometry
  const cx = 110, cy = 110, R = 82, ri = 30;
  const radialMax = Math.max(...hourly, 1);

  return (
    <div className="grid2">
      <div className="pc" style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Tu día energético
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeWidth="1" opacity=".5" />
            <circle cx={cx} cy={cy} r={ri} fill="#F0F3EE" stroke="var(--line)" />
            {hourly.map((v, h) => {
              const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
              const bl = ri + (v / radialMax) * (R - ri);
              const x1 = cx + Math.cos(a) * (ri + 4);
              const y1 = cy + Math.sin(a) * (ri + 4);
              const x2 = cx + Math.cos(a) * bl;
              const y2 = cy + Math.sin(a) * bl;
              const current = h === nowHour;
              return (
                <line
                  key={h}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={current ? 'var(--green)' : '#2D8A2D'}
                  strokeWidth={current ? 6 : 4.5}
                  strokeLinecap="round"
                  opacity={current ? 1 : 0.4}
                />
              );
            })}
            {[0, 6, 12, 18].map((h) => {
              const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(a) * (R + 14);
              const y = cy + Math.sin(a) * (R + 14);
              return (
                <text key={h} x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="500" fill="var(--muted)">
                  {h}h
                </text>
              );
            })}
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--green)">
              {nowHour}h
            </text>
          </svg>
        </div>
      </div>

      <div className="pc" style={{ padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>
          Consumo mensual
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, letterSpacing: '-.02em' }}>
            {Number(lastConsumption?.totalKwh ?? 0).toFixed(0)} kWh
          </span>
          <span className="bd">
            {(lastConsumption?.changePercent ?? 0) > 0 ? '+' : ''}
            {lastConsumption?.changePercent ?? 0}%
          </span>
        </div>
        <svg width="100%" height="70" viewBox="0 0 200 70">
          <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Últimos 12 meses</p>
      </div>
    </div>
  );
}
