import type { Supply } from '../types';

interface Props { supply: Supply; }

const ACTIONS = [
  {
    label: 'Modificar potencia',
    desc: (s: Supply) => `Actual: ${Number(s.contractedPower).toFixed(1).replace('.', ',')} kW`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    label: 'Cambio de titular',
    desc: () => 'Transferir a otra persona',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v6M23 11h-6" />
      </svg>
    ),
  },
  {
    label: 'Cambiar tarifa',
    desc: () => 'Compara y solicita',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 3v18h18" />
        <path d="M7 17l4-4 4 4 5-5" />
      </svg>
    ),
  },
];

export function TarifaTab({ supply }: Props) {
  const t = supply.tariff;
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="pc" style={{ padding: 28 }}>
        <div className="tar-grid">
          <div style={{ paddingLeft: 20, borderLeft: '4px solid var(--green)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--green)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              Tu tarifa actual con {t?.contractName ?? 'Possibility Energía'}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 54, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 }}>
                €{Number(t?.pricePerKwh ?? 0).toFixed(4).replace('.', ',')}
              </span>
              <span style={{ fontSize: 16, color: 'var(--muted)' }}>/kWh</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Coste medio mensual:{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>
                {Number(t?.monthlyBaseCost ?? 0).toFixed(0)}€
              </strong>
            </p>
            <div style={{ padding: '18px 28px', borderRadius: 18, background: 'var(--green-soft)', textAlign: 'center', width: 'fit-content' }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Más barata que la media
              </p>
              <p style={{ fontSize: 30, fontWeight: 500, color: 'var(--green)', lineHeight: 1 }}>
                {t?.marketAvgPercent ?? 0}%
              </p>
            </div>
          </div>

          <div className="tar-actions">
            {ACTIONS.map((a) => (
              <button key={a.label} className="act">
                <div className="ic">{a.icon}</div>
                <p className="lbl">{a.label}</p>
                <p className="desc">{a.desc(supply)}</p>
              </button>
            ))}
            <button className="act act-danger">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </div>
              <p className="lbl">Dar de baja</p>
              <p className="desc">Cancelar suministro</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
