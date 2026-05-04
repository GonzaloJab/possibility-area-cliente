import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TempPasswordCard } from '../components/TempPasswordCard';
import { api, ApiError } from '../lib/api';
import { formatDate } from '../lib/format';
import type { ClientDetail as ClientDetailT } from '../types';

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:5173';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetailT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getClient(id)
      .then(({ client }) => setClient(client))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando cliente'));
  }, [id]);

  async function handleResetPassword() {
    if (!id || !confirm('¿Generar nueva contraseña temporal?')) return;
    setBusy(true);
    try {
      const { tempPassword } = await api.resetPassword(id);
      setTempPw(tempPassword);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error');
    } finally { setBusy(false); }
  }

  async function handleImpersonate() {
    if (!id) return;
    setBusy(true);
    try {
      const { token } = await api.impersonate(id);
      // Open client app with token in URL hash → client app reads & stores it
      const url = `${CLIENT_URL}/?impersonation=${encodeURIComponent(token)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error');
    } finally { setBusy(false); }
  }

  async function handleDeactivate() {
    if (!id || !client) return;
    const newActive = !client.isActive;
    const verb = newActive ? 'reactivar' : 'desactivar';
    if (!confirm(`¿Seguro que quieres ${verb} esta cuenta?`)) return;
    setBusy(true);
    try {
      const { client: updated } = await api.updateClient(id, { isActive: newActive });
      setClient(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error');
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!id || !confirm('¿Eliminar este cliente? Quedará desactivado (no se borran sus datos).')) return;
    setBusy(true);
    try {
      await api.deleteClient(id);
      navigate('/clients');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error');
    } finally { setBusy(false); }
  }

  if (error) return <div className="alert err">{error}</div>;
  if (!client) return <div className="muted">Cargando…</div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{client.name}</h1>
          <p className="sub mono" style={{ fontSize: 13 }}>{client.email}</p>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className={`badge ${client.isActive ? 'ok' : 'muted'}`}>
              {client.isActive ? 'Activo' : 'Inactivo'}
            </span>
            {client.mustChangePassword && (
              <span className="badge warn">Pendiente cambiar contraseña</span>
            )}
          </div>
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <button className="btn outline" onClick={handleImpersonate} disabled={busy}>
            👤 Ver como cliente
          </button>
          <button className="btn outline" onClick={handleResetPassword} disabled={busy}>
            🔑 Reset contraseña
          </button>
          <button className="btn outline" onClick={handleDeactivate} disabled={busy}>
            {client.isActive ? 'Desactivar' : 'Reactivar'}
          </button>
          <button className="btn danger" onClick={handleDelete} disabled={busy}>
            Eliminar
          </button>
        </div>
      </div>

      {tempPw && (
        <div style={{ marginBottom: 20 }}>
          <TempPasswordCard email={client.email} password={tempPw} />
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex between" style={{ marginBottom: 16 }}>
          <h2>Suministros</h2>
          <button
            className="btn primary sm"
            onClick={() => alert('TODO: implementar añadir suministro desde la ficha del cliente. Por ahora usa el wizard.')}
          >
            + Añadir suministro
          </button>
        </div>
        {client.supplies.length === 0 ? (
          <p className="muted">Sin suministros aún.</p>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Alias</th>
                <th>Dirección</th>
                <th>Tipo</th>
                <th>CUPS</th>
                <th>Facturas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {client.supplies.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.alias}</strong></td>
                  <td>{s.address}</td>
                  <td><span className="badge muted">{s.type}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>{s.cups ?? '—'}</td>
                  <td>{s.invoices?.length ?? 0}</td>
                  <td className="actions">
                    <Link className="btn ghost sm" to={`/supplies/${s.id}`}>Abrir →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="muted" style={{ fontSize: 12 }}>
        Cuenta creada el {formatDate(client.createdAt)}.
      </p>
    </>
  );
}
