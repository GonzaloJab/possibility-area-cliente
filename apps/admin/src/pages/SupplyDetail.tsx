import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { OcrReviewTable, emptyImport, type ReviewRow } from '../components/OcrReviewTable';
import { PdfDropzone } from '../components/PdfDropzone';
import { api, ApiError } from '../lib/api';
import { formatDate, formatEur } from '../lib/format';
import type { ClientDetail, InvoiceImportItem, Supply } from '../types';

export function SupplyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Upload + OCR state
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [stubBanner, setStubBanner] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: string[] } | null>(null);

  // Find supply via the parent client (we don't have a direct admin endpoint for a single supply,
  // but the supply id is unique so we list clients and find it).
  useEffect(() => {
    if (!id) return;
    api.listClients()
      .then(async ({ clients }) => {
        for (const c of clients) {
          const { client } = await api.getClient(c.id);
          const found = client.supplies.find((s) => s.id === id);
          if (found) { setSupply(found); setClient(client); return; }
        }
        setError('Suministro no encontrado');
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error'));
  }, [id]);

  async function runOcr(files: File[]) {
    if (!id) return;
    setError(null);
    setBusy(true);
    try {
      const { previews } = await api.ocrPreview(id, files);
      setStubBanner(previews.some((p) => p.isStub));
      setReviewRows(previews.map((p) => ({ ...p, edited: emptyImport(p), include: true })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'OCR falló');
    } finally { setBusy(false); }
  }

  function updateRow(idx: number, edited: Partial<InvoiceImportItem>) {
    setReviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, edited: { ...r.edited, ...edited } } : r)));
  }
  function toggleRow(idx: number) {
    setReviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, include: !r.include } : r)));
  }

  async function saveInvoices() {
    if (!id) return;
    const toImport = reviewRows.filter((r) => r.include).map((r) => r.edited);
    if (toImport.length === 0) return;
    setBusy(true);
    try {
      const result = await api.bulkImportInvoices(id, toImport);
      setImportResult(result);
      setReviewRows([]);
      // Refresh
      if (client) {
        const { client: refreshed } = await api.getClient(client.id);
        setClient(refreshed);
        setSupply(refreshed.supplies.find((s) => s.id === id) ?? null);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron guardar');
    } finally { setBusy(false); }
  }

  async function deleteSupply() {
    if (!id || !confirm('¿Eliminar este suministro? Se borrarán todas sus facturas y consumos.')) return;
    setBusy(true);
    try {
      await api.deleteSupply(id);
      if (client) navigate(`/clients/${client.id}`);
      else navigate('/clients');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error');
    } finally { setBusy(false); }
  }

  if (error) return <div className="alert err">{error}</div>;
  if (!supply || !client) return <div className="muted">Cargando…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="sub" style={{ marginBottom: 4 }}>
            <Link to={`/clients/${client.id}`}>← {client.name}</Link>
          </p>
          <h1>{supply.alias}</h1>
          <p className="sub">{supply.address} · <span className="mono">{supply.cups ?? 'sin CUPS'}</span></p>
        </div>
        <div className="flex gap-8">
          <button className="btn danger" onClick={deleteSupply} disabled={busy}>Eliminar</button>
        </div>
      </div>

      {importResult && (
        <div className="alert info">
          ✓ {importResult.created} facturas guardadas
          {importResult.skipped.length > 0 && <> · {importResult.skipped.length} duplicadas saltadas</>}.
        </div>
      )}

      {stubBanner && (
        <div className="alert warn">
          ⚠ OCR en modo placeholder. Edita los valores antes de guardar.
        </div>
      )}

      {/* Upload zone */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Subir más facturas</h2>
        <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
          Suelta nuevos PDFs aquí. El OCR los procesará y los podrás revisar antes de guardar.
        </p>
        <PdfDropzone onDrop={runOcr} disabled={busy} />
      </div>

      {/* OCR review */}
      {reviewRows.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2>Revisar y guardar</h2>
          <OcrReviewTable rows={reviewRows} onChange={updateRow} onToggleInclude={toggleRow} />
          <div className="wizard-actions">
            <button className="btn ghost" onClick={() => setReviewRows([])}>Descartar</button>
            <button
              className="btn primary"
              onClick={saveInvoices}
              disabled={busy || reviewRows.filter((r) => r.include).length === 0}
            >
              {busy ? 'Guardando…' : `Guardar ${reviewRows.filter((r) => r.include).length}`}
            </button>
          </div>
        </div>
      )}

      {/* Existing invoices list */}
      <div className="card">
        <h2>Facturas existentes ({supply.invoices?.length ?? 0})</h2>
        {(!supply.invoices || supply.invoices.length === 0) ? (
          <p className="muted" style={{ marginTop: 14 }}>Sin facturas. Sube los PDFs arriba.</p>
        ) : (
          <table className="data" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Periodo</th>
                <th>Fecha</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {supply.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono">{inv.number}</td>
                  <td>{inv.period}</td>
                  <td className="muted">{formatDate(inv.issuedAt)}</td>
                  <td><strong>{formatEur(inv.amount)}</strong></td>
                  <td>
                    <span className={`badge ${inv.status === 'PAGADA' ? 'ok' : inv.status === 'PENDIENTE' ? 'warn' : 'err'}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
