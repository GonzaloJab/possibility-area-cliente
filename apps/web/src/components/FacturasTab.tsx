import type { Supply } from '../types';

interface Props {
  supply: Supply;
}

function statusBadge(status: string) {
  if (status === 'PAGADA') {
    return (
      <span className="bd bd--success">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8l4 4 6-7" />
        </svg>
        Pagada
      </span>
    );
  }
  if (status === 'PENDIENTE') {
    return (
      <span className="bd bd--warn">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v5M8 12h.01" />
        </svg>
        Pendiente
      </span>
    );
  }
  return (
    <span className="bd bd--danger">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9H4M12 13H4" />
      </svg>
      Vencida
    </span>
  );
}

export function FacturasTab({ supply }: Props) {
  const invoices = supply.invoices ?? [];
  const cellPd = 'clamp(8px, 2vw, 14px) clamp(10px, 2vw, 20px)';
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="pc table-responsive" style={{ overflow: 'hidden' }}>
        <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(12px, 3vw, 14px)', minWidth: 520 }}>
          <thead>
            <tr style={{ background: 'var(--surface-grey)' }}>
              {['Nº', 'Fecha', 'Importe', 'Estado', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: cellPd,
                    fontWeight: 600,
                    fontSize: 'clamp(10px, 2.5vw, 11px)',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: cellPd, fontWeight: 600 }}>{inv.number}</td>
                <td style={{ padding: cellPd, color: 'var(--muted)' }}>
                  {new Date(inv.issuedAt).toLocaleDateString('es-ES')}
                </td>
                <td style={{ padding: cellPd, fontWeight: 600 }}>
                  €{Number(inv.amount).toFixed(2).replace('.', ',')}
                </td>
                <td style={{ padding: cellPd }}>{statusBadge(inv.status)}</td>
                <td style={{ padding: cellPd }}>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      borderRadius: 8,
                      fontSize: 'clamp(10px, 2.8vw, 12px)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontFamily: 'inherit',
                    }}
                    onClick={() => inv.pdfUrl && window.open(inv.pdfUrl, '_blank')}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 2v9M4 8l4 4 4-4M2 13h12" />
                    </svg>
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
