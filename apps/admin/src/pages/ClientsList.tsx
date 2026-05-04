import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { ClientSummary } from '../types';

export function ClientsList() {
  const [clients, setClients] = useState<ClientSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.listClients()
      .then(({ clients }) => setClients(clients))
      .catch((e) => setError(e.message ?? 'Error cargando clientes'));
  }, []);

  const filtered = clients?.filter((c) =>
    !filter
    || c.name.toLowerCase().includes(filter.toLowerCase())
    || c.email.toLowerCase().includes(filter.toLowerCase()),
  ) ?? [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="sub">{clients ? `${clients.length} cuenta${clients.length === 1 ? '' : 's'}` : '…'}</p>
        </div>
        <div className="flex gap-12">
          <input
            placeholder="Buscar por nombre o email…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', minWidth: 260 }}
          />
          <Link className="btn primary" to="/clients/new">+ Nuevo cliente</Link>
        </div>
      </div>

      {error && <div className="alert err">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Suministros</th>
              <th>Última factura</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td className="mono" style={{ fontSize: 13 }}>{c.email}</td>
                <td>{c.suppliesCount}</td>
                <td className="muted">{formatDate(c.lastInvoiceAt)}</td>
                <td>
                  <span className={`badge ${c.isActive ? 'ok' : 'muted'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="actions">
                  <Link className="btn ghost sm" to={`/clients/${c.id}`}>Abrir →</Link>
                </td>
              </tr>
            ))}
            {clients && filtered.length === 0 && (
              <tr><td colSpan={6} className="muted center" style={{ padding: 32 }}>
                {clients.length === 0 ? 'Aún no hay clientes. Empieza con "Nuevo cliente".' : 'Sin resultados.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
