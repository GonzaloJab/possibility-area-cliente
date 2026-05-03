import type { Supply } from '../types';

interface Props { supply: Supply; }

export function FacturasTab({ supply }: Props) {
  const invoices = supply.invoices ?? [];
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="pc" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F0F3EE' }}>
              {['Nº', 'Fecha', 'Importe', 'Estado', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '14px 20px',
                    fontWeight: 500,
                    fontSize: 11,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
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
                <td style={{ padding: '14px 20px', fontWeight: 500 }}>{inv.number}</td>
                <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>
                  {new Date(inv.issuedAt).toLocaleDateString('es-ES')}
                </td>
                <td style={{ padding: '14px 20px', fontWeight: 500 }}>
                  €{Number(inv.amount).toFixed(2).replace('.', ',')}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span className="bd">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8l4 4 6-7" />
                    </svg>
                    {inv.status === 'PAGADA' ? 'Pagada' : inv.status === 'PENDIENTE' ? 'Pendiente' : 'Vencida'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <button
                    style={{
                      padding: '7px 14px',
                      border: '1px solid var(--line)',
                      background: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
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
