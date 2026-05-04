import type { Supply } from '../types';
import type { TabKey } from '../pages/Dashboard';

interface Props {
  supply: Supply;
  activeTab: TabKey;
  onTabChange: (t: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'consumo', label: 'Consumo' },
  { key: 'facturas', label: 'Facturas' },
  { key: 'tarifa', label: 'Tarifa' },
];

export function HeroBanner({ supply, activeTab, onTabChange }: Props) {
  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 340, marginBottom: 20, boxShadow: '0 8px 32px rgba(0,0,0,.06)' }}>
      <img src={supply.heroImageUrl ?? ''} alt={supply.address} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.55) 100%)' }} />
      <div style={{ position: 'absolute', top: 22, left: 22, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', fontSize: 12, fontWeight: 500 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {supply.zone}
      </div>
      <div style={{ position: 'absolute', top: 22, right: 22, display: 'flex', gap: 7 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Luz">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D49B2A" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Gas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
            <path d="M12 2C8 6 6 9 6 13a6 6 0 0012 0c0-4-2-7-6-11z" />
          </svg>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 78, left: 30, right: 30, color: '#fff' }}>
        <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.9, marginBottom: 5, textShadow: '0 1px 8px rgba(0,0,0,.3)' }}>
          {supply.subtitle}
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, letterSpacing: '-.02em', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,.4)' }}>
          {supply.address}
        </h2>
      </div>
      <div style={{ position: 'absolute', bottom: 22, left: 30, display: 'flex', gap: 5, padding: 5, borderRadius: 100, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.25)' }}>
        {TABS.map((t) => (
          <button key={t.key} className={`pt ${activeTab === t.key ? 'a' : ''}`} onClick={() => onTabChange(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
