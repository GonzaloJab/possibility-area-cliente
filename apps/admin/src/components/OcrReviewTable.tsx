import type { InvoiceImportItem, OcrPreview } from '../types';

export interface ReviewRow extends OcrPreview {
  edited: InvoiceImportItem;
  include: boolean;
}

interface Props {
  rows: ReviewRow[];
  onChange: (idx: number, edited: Partial<InvoiceImportItem>) => void;
  onToggleInclude: (idx: number) => void;
}

const STATUS = ['PAGADA', 'PENDIENTE', 'VENCIDA'] as const;

export function OcrReviewTable({ rows, onChange, onToggleInclude }: Props) {
  if (rows.length === 0) {
    return <p className="muted">Sube al menos un PDF para ver los datos extraídos.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data" style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th style={{ width: 36 }}></th>
            <th>Archivo</th>
            <th>Nº</th>
            <th>Periodo</th>
            <th>Fecha</th>
            <th>Importe (€)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ opacity: r.include ? 1 : 0.5 }}>
              <td>
                <input
                  type="checkbox"
                  checked={r.include}
                  onChange={() => onToggleInclude(i)}
                  title="Incluir esta factura al guardar"
                />
              </td>
              <td className="mono" style={{ fontSize: 12 }}>{r.filename}</td>
              <td>
                <input
                  value={r.edited.number}
                  onChange={(e) => onChange(i, { number: e.target.value })}
                  style={{ minWidth: 130 }}
                />
              </td>
              <td>
                <input
                  value={r.edited.period}
                  onChange={(e) => onChange(i, { period: e.target.value })}
                  style={{ minWidth: 90 }}
                  placeholder="Mar 2026"
                />
              </td>
              <td>
                <input
                  type="date"
                  value={r.edited.issuedAt.slice(0, 10)}
                  onChange={(e) => onChange(i, { issuedAt: new Date(e.target.value).toISOString() })}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  value={r.edited.amount}
                  onChange={(e) => onChange(i, { amount: e.target.value })}
                  style={{ minWidth: 100 }}
                />
              </td>
              <td>
                <select
                  value={r.edited.status}
                  onChange={(e) => onChange(i, { status: e.target.value as InvoiceImportItem['status'] })}
                >
                  {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const _allFields = ['number', 'period', 'issuedAt', 'amount', 'status'] as const;
export type ReviewFieldKey = typeof _allFields[number];

// Used by the wizard
export function emptyImport(p: OcrPreview): InvoiceImportItem {
  const e = p.extracted;
  return {
    number: e.number ?? '',
    period: e.period ?? '',
    issuedAt: e.issued_at ?? new Date().toISOString(),
    amount: e.amount ?? '0',
    status: 'PAGADA',
    supplier: e.supplier ?? null,
    rawOcr: p.rawOcr,
    pdfUrl: null,
  };
}
