import type { Supply } from '../types';

interface Props {
  supply: Supply;
  open: boolean;
  onClose: () => void;
}

const ROWS = [
  {
    section: 'Datos personales',
    items: [
      {
        title: 'Modificar datos personales',
        desc: 'Email, teléfono, IBAN',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
      },
    ],
  },
];

export function SettingsModal({ supply, open, onClose }: Props) {
  return (
    <div className={`modal-bg ${open ? 'show' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3>Ajustes del suministro</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>{supply.address}</p>
          </div>
          <button className="ic-btn" style={{ width: 32, height: 32 }} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {ROWS.map((sec) => (
          <div key={sec.section}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>
              {sec.section}
            </p>
            {sec.items.map((it) => (
              <div key={it.title} className="modal-row">
                {it.icon}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{it.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>
          Contrato
        </p>
        <div className="modal-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>Modificar potencia contratada</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
              Actual: {Number(supply.contractedPower).toFixed(1).replace('.', ',')} kW
            </p>
          </div>
        </div>
        <div className="modal-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>Cambio de titular</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Transferir a otra persona</p>
          </div>
        </div>
        <div className="modal-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 17l4-4 4 4 5-5" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>Cambiar tarifa</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Compara y solicita el cambio</p>
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '18px 0 8px' }}>
          Otras gestiones
        </p>
        <div className="modal-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>Otra petición</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Reclamación, duda, solicitud libre</p>
          </div>
        </div>
        <div className="modal-row" style={{ borderColor: 'var(--pink-line)', background: 'var(--pink)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0, color: 'var(--red)' }}>Dar de baja</p>
            <p style={{ fontSize: 12, color: 'var(--red)', opacity: 0.7, margin: '2px 0 0' }}>Cancelar suministro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
