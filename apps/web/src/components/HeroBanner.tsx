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
    <div className="hero-banner">
      <img
        src={supply.heroImageUrl ?? ''}
        alt={supply.address}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.55) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 'clamp(10px, 3vw, 22px)',
          left: 'clamp(10px, 3vw, 22px)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px',
          borderRadius: 100,
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(12px)',
          fontSize: 'clamp(10px, 2.8vw, 12px)',
          fontWeight: 600,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {supply.zone}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 'clamp(10px, 3vw, 22px)',
          right: 'clamp(10px, 3vw, 22px)',
          display: 'flex',
          gap: 7,
        }}
      >
        {[
          { title: 'Luz', stroke: '#D49B2A' },
          { title: 'Gas', stroke: '#E24B4A' },
        ].map(({ title, stroke }) => (
          <div
            key={title}
            title={title}
            style={{
              width: 'clamp(32px, 8vw, 38px)',
              height: 'clamp(32px, 8vw, 38px)',
              borderRadius: 12,
              background: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {title === 'Luz' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
                <path d="M12 2C8 6 6 9 6 13a6 6 0 0012 0c0-4-2-7-6-11z" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(56px, 18vw, 78px)',
          left: 'clamp(12px, 3vw, 30px)',
          right: 'clamp(12px, 3vw, 30px)',
          color: '#fff',
        }}
      >
        <p
          style={{
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontWeight: 600,
            opacity: 0.92,
            marginBottom: 4,
            textShadow: '0 1px 8px rgba(0,0,0,.3)',
          }}
        >
          {supply.subtitle}
        </p>
        <h2 className="hero-title" style={{ color: '#fff' }}>
          {supply.address}
        </h2>
      </div>
      <nav className="hero-tabs" aria-label="Secciones del suministro">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`pt ${activeTab === t.key ? 'a' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
