import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OcrReviewTable, emptyImport, type ReviewRow } from '../components/OcrReviewTable';
import { PdfDropzone } from '../components/PdfDropzone';
import { TempPasswordCard } from '../components/TempPasswordCard';
import { api, ApiError } from '../lib/api';
import type { InvoiceImportItem, Supply, SupplyType } from '../types';

type Step = 1 | 2 | 3 | 4;

interface ClientDraft { email: string; name: string; }
interface SupplyDraft {
  alias: string;
  address: string;
  zone: string;
  subtitle: string;
  type: SupplyType;
  contractedPower: string;
  cups: string;
  supplier: string;
  heroImageUrl: string;
}

const SUPPLY_DEFAULTS: SupplyDraft = {
  alias: 'Suministro 1',
  address: '',
  zone: '',
  subtitle: '',
  type: 'RESIDENCIAL',
  contractedPower: '4.6',
  cups: '',
  supplier: '',
  heroImageUrl: '',
};

export function NewClientWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // step 1
  const [client, setClient] = useState<ClientDraft>({ email: '', name: '' });
  const [createdClient, setCreatedClient] = useState<{ id: string; tempPassword: string; email: string } | null>(null);

  // step 2
  const [supply, setSupply] = useState<SupplyDraft>(SUPPLY_DEFAULTS);
  const [createdSupply, setCreatedSupply] = useState<Supply | null>(null);

  // step 3
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [stubBanner, setStubBanner] = useState(false);

  // step 4
  const [importResult, setImportResult] = useState<{ created: number; skipped: string[] } | null>(null);

  // ─── Step 1: create client ─────────────────────────────────────
  async function submitStep1() {
    setError(null);
    setBusy(true);
    try {
      const out = await api.createClient(client.email, client.name);
      setCreatedClient({ id: out.user.id, tempPassword: out.tempPassword, email: out.user.email });
      setStep(2);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el cliente');
    } finally {
      setBusy(false);
    }
  }

  // ─── Step 2: create supply ─────────────────────────────────────
  async function submitStep2() {
    if (!createdClient) return;
    setError(null);
    setBusy(true);
    try {
      const created = await api.createSupply(createdClient.id, {
        alias: supply.alias,
        address: supply.address,
        zone: supply.zone,
        subtitle: supply.subtitle || `Suministro · ${supply.address}`,
        type: supply.type,
        contractedPower: supply.contractedPower,
        cups: supply.cups || null,
        supplier: supply.supplier || null,
        heroImageUrl: supply.heroImageUrl || null,
      });
      setCreatedSupply(created);
      setStep(3);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el suministro');
    } finally {
      setBusy(false);
    }
  }

  // ─── Step 3: OCR preview ───────────────────────────────────────
  async function runOcr(files: File[]) {
    if (!createdSupply) return;
    setPdfs(files);
    setError(null);
    setBusy(true);
    try {
      const { previews } = await api.ocrPreview(createdSupply.id, files);
      setStubBanner(previews.some((p) => p.isStub));
      setReviewRows(previews.map((p) => ({ ...p, edited: emptyImport(p), include: true })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'OCR falló');
    } finally {
      setBusy(false);
    }
  }

  function updateRow(idx: number, edited: Partial<InvoiceImportItem>) {
    setReviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, edited: { ...r.edited, ...edited } } : r)));
  }
  function toggleRow(idx: number) {
    setReviewRows((prev) => prev.map((r, i) => (i === idx ? { ...r, include: !r.include } : r)));
  }

  async function submitStep3() {
    if (!createdSupply) return;
    const toImport = reviewRows.filter((r) => r.include).map((r) => r.edited);
    if (toImport.length === 0) { setStep(4); return; }
    setError(null);
    setBusy(true);
    try {
      const result = await api.bulkImportInvoices(createdSupply.id, toImport);
      setImportResult(result);
      setStep(4);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron guardar las facturas');
    } finally {
      setBusy(false);
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────
  const steps = useMemo<{ n: Step; label: string }[]>(() => [
    { n: 1, label: 'Cliente' },
    { n: 2, label: 'Suministro' },
    { n: 3, label: 'Subir facturas (OCR)' },
    { n: 4, label: 'Listo' },
  ], []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nuevo cliente</h1>
          <p className="sub">Onboarding paso a paso. Las facturas pasarán por OCR antes de guardarse.</p>
        </div>
      </div>

      <div className="wizard-steps">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`wizard-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}
          >
            <span className="num">{s.n}</span>
            {s.label}
          </div>
        ))}
      </div>

      {error && <div className="alert err">{error}</div>}

      {/* ─── STEP 1 ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card">
          <h2>Datos del cliente</h2>
          <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
            Genera la cuenta. Verás la contraseña temporal antes de continuar.
          </p>
          <div className="row">
            <div className="field">
              <label>Nombre</label>
              <input
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="Felipe García"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>
          <div className="wizard-actions">
            <button className="btn ghost" onClick={() => navigate('/clients')}>Cancelar</button>
            <button
              className="btn primary"
              onClick={submitStep1}
              disabled={busy || !client.email || !client.name}
            >
              {busy ? 'Creando…' : 'Crear cliente →'}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2 ──────────────────────────────────────────────── */}
      {step === 2 && createdClient && (
        <>
          <div style={{ marginBottom: 20 }}>
            <TempPasswordCard email={createdClient.email} password={createdClient.tempPassword} />
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Guárdala. Esta es la única vez que se mostrará. El cliente deberá cambiarla en su primer login.
            </p>
          </div>

          <div className="card">
            <h2>Primer suministro</h2>
            <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
              Crea al menos uno. Podrás añadir más desde la ficha del cliente.
            </p>
            <div className="row">
              <div className="field">
                <label>Alias interno</label>
                <input
                  value={supply.alias}
                  onChange={(e) => setSupply({ ...supply, alias: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Tipo</label>
                <select
                  value={supply.type}
                  onChange={(e) => setSupply({ ...supply, type: e.target.value as SupplyType })}
                >
                  <option value="RESIDENCIAL">Residencial</option>
                  <option value="RESTAURACION">Restauración</option>
                  <option value="EMPRESA">Empresa</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Dirección</label>
              <input
                value={supply.address}
                onChange={(e) => setSupply({ ...supply, address: e.target.value })}
                placeholder="C/ Ortega y Gasset 24, 4ºB"
              />
            </div>
            <div className="row">
              <div className="field">
                <label>Zona</label>
                <input
                  value={supply.zone}
                  onChange={(e) => setSupply({ ...supply, zone: e.target.value })}
                  placeholder="Madrid · Salamanca"
                />
              </div>
              <div className="field">
                <label>Subtítulo</label>
                <input
                  value={supply.subtitle}
                  onChange={(e) => setSupply({ ...supply, subtitle: e.target.value })}
                  placeholder="Tu hogar conectado · Vivienda residencial"
                />
              </div>
            </div>
            <div className="row3">
              <div className="field">
                <label>Potencia contratada (kW)</label>
                <input
                  type="number" step="0.1"
                  value={supply.contractedPower}
                  onChange={(e) => setSupply({ ...supply, contractedPower: e.target.value })}
                />
              </div>
              <div className="field">
                <label>CUPS</label>
                <input
                  value={supply.cups}
                  onChange={(e) => setSupply({ ...supply, cups: e.target.value })}
                  placeholder="ES0021000000000000XX"
                />
                <p className="help">Identificador del suministro. El OCR lo extraerá si está en la factura.</p>
              </div>
              <div className="field">
                <label>Comercializadora</label>
                <input
                  value={supply.supplier}
                  onChange={(e) => setSupply({ ...supply, supplier: e.target.value })}
                  placeholder="Iberdrola, Endesa, Naturgy…"
                />
              </div>
            </div>
            <div className="field">
              <label>URL imagen hero (opcional)</label>
              <input
                value={supply.heroImageUrl}
                onChange={(e) => setSupply({ ...supply, heroImageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/…"
              />
            </div>

            <div className="wizard-actions">
              <button className="btn ghost" onClick={() => setStep(1)}>← Atrás</button>
              <button
                className="btn primary"
                onClick={submitStep2}
                disabled={busy || !supply.address || !supply.zone}
              >
                {busy ? 'Creando…' : 'Crear suministro →'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── STEP 3 ──────────────────────────────────────────────── */}
      {step === 3 && createdSupply && (
        <>
          {stubBanner && (
            <div className="alert warn">
              ⚠ El módulo OCR aún está en modo placeholder — los datos extraídos son ficticios.
              Edítalos manualmente o reemplaza el OCR real en <span className="mono">apps/api/app/ocr/extractor.py</span>.
            </div>
          )}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2>Subir facturas anteriores</h2>
            <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
              Arrastra los PDFs. El OCR extraerá los datos y podrás revisarlos antes de guardar.
            </p>
            <PdfDropzone onDrop={runOcr} disabled={busy} />
            {pdfs.length > 0 && (
              <p style={{ marginTop: 14, fontSize: 13 }} className="muted">
                {busy ? 'Procesando…' : `${pdfs.length} archivo${pdfs.length === 1 ? '' : 's'} cargado${pdfs.length === 1 ? '' : 's'}.`}
              </p>
            )}
          </div>

          {reviewRows.length > 0 && (
            <div className="card">
              <h2>Revisar datos extraídos</h2>
              <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
                Edita lo que sea necesario. Desmarca filas que no quieras importar.
              </p>
              <OcrReviewTable rows={reviewRows} onChange={updateRow} onToggleInclude={toggleRow} />
            </div>
          )}

          <div className="wizard-actions">
            <button className="btn ghost" onClick={() => setStep(2)}>← Atrás</button>
            <div className="flex gap-12">
              <button className="btn outline" onClick={() => setStep(4)} disabled={busy}>
                Saltar este paso
              </button>
              <button
                className="btn primary"
                onClick={submitStep3}
                disabled={busy || reviewRows.length === 0}
              >
                {busy ? 'Guardando…' : `Guardar ${reviewRows.filter((r) => r.include).length} facturas →`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── STEP 4 ──────────────────────────────────────────────── */}
      {step === 4 && createdClient && (
        <div className="card">
          <h2>✓ Cliente onboardeado</h2>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
            La cuenta de <strong>{createdClient.email}</strong> está lista.
            {importResult && (
              <> Se importaron <strong>{importResult.created}</strong> facturas
              {importResult.skipped.length > 0 && <> ({importResult.skipped.length} duplicadas saltadas)</>}.</>
            )}
          </p>

          <TempPasswordCard email={createdClient.email} password={createdClient.tempPassword} />
          <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 24 }}>
            Envíasela al cliente por el canal que prefieras.
          </p>

          <div className="flex gap-12">
            <button className="btn outline" onClick={() => navigate(`/clients/${createdClient.id}`)}>
              Ver ficha del cliente
            </button>
            <button className="btn primary" onClick={() => navigate('/clients')}>
              Volver a la lista
            </button>
          </div>
        </div>
      )}
    </>
  );
}
