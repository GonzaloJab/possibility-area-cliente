import { useMemo, useState } from 'react';

interface Booster {
  id: string;
  label: string;
  desc: string;
  mult: number;
  on: boolean;
}

const INITIAL: Booster[] = [
  { id: 'sumExtra', label: 'Traer otro suministro', desc: 'Añade luz o gas', mult: 0.2, on: false },
  { id: 'whatsapp', label: 'Activación comunicación por WhatsApp', desc: 'Avisos rápidos al móvil', mult: 0.2, on: false },
  { id: 'autocontrato', label: 'Activación autocontrato', desc: 'Renovación automática y firma sin papeleo', mult: 0.5, on: false },
];

const BASE_VEL = 1.4;

export function ShipmentBooster() {
  const [boosters, setBoosters] = useState<Booster[]>(INITIAL);
  const [expanded, setExpanded] = useState(false);

  const velocity = useMemo(
    () => (BASE_VEL + boosters.reduce((s, b) => s + (b.on ? b.mult : 0), 0)).toFixed(1),
    [boosters],
  );

  const toggle = (id: string) =>
    setBoosters((prev) => prev.map((b) => (b.id === id ? { ...b, on: !b.on } : b)));

  return (
    <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 220, boxShadow: '0 8px 32px rgba(0,0,0,.06)', transition: 'all .35s' }}>
      <img
        src="https://images.unsplash.com/photo-1632934607261-9d36e2305f55?w=1600&q=85&auto=format&fit=crop"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,58,13,.88) 0%, rgba(13,58,13,.55) 60%, rgba(13,58,13,.25) 100%)' }} />
      {!expanded ? (
        <div style={{ position: 'relative', padding: '32px 36px', color: '#fff' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85, margin: '0 0 6px' }}>
            Tu próximo envío Possibility®
          </p>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, letterSpacing: '-.02em', margin: '0 0 6px' }}>
            Llega en 87 días
          </h3>
          <p style={{ fontSize: 14, opacity: 0.9, maxWidth: 520, lineHeight: 1.5, margin: '0 0 28px' }}>
            Esta vez recibirás un <strong>aceite de oliva virgen extra</strong> de un molino familiar de Jaén · primera prensada en frío, sin filtrar.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
              <div>
                <p style={{ fontSize: 11, opacity: 0.7, letterSpacing: '.06em', textTransform: 'uppercase', margin: 0 }}>Faltan</p>
                <p style={{ fontSize: 30, fontWeight: 500, fontFamily: "'Playfair Display', serif", margin: 0 }}>
                  87 <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7 }}>días</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, opacity: 0.7, letterSpacing: '.06em', textTransform: 'uppercase', margin: 0 }}>Tu velocidad</p>
                <p style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>×{velocity}</p>
              </div>
            </div>
            <button className="pg" onClick={() => setExpanded(true)}>
              Acelerar mi envío
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 10h10M11 6l4 4-4 4" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', padding: '32px 36px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.85, margin: '0 0 4px' }}>
                Acelera tu envío
              </p>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, letterSpacing: '-.02em', margin: 0 }}>
                Activa boosters · velocidad ×{velocity}
              </h3>
            </div>
            <button className="pg" onClick={() => setExpanded(false)}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>{' '}
              Cerrar
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
            {boosters.map((b) => (
              <div key={b.id} className={`boost-row ${b.on ? 'on' : ''}`} onClick={() => toggle(b.id)}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{b.label}</p>
                  <p style={{ fontSize: 11, opacity: 0.75, margin: '2px 0 0' }}>{b.desc}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.18)', padding: '3px 9px', borderRadius: 100, marginRight: 10 }}>
                  ×{b.mult.toFixed(1)}
                </span>
                <div className={`toggle ${b.on ? 'on' : ''}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
