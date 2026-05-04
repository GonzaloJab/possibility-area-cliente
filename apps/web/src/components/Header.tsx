import { useAuth } from '../lib/auth';

interface Props {
  supplies: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenSettings: () => void;
}

export function Header({ supplies, activeId, onSelect, onOpenSettings }: Props) {
  const { user, logout, isImpersonating } = useAuth();
  return (
    <>
      {isImpersonating && (
        <div
          style={{
            background: '#1A1E18',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 12,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 13,
          }}
        >
          <span>👤 Estás viendo esta cuenta como administrador (sesión de 1h).</span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,.15)',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Salir de la sesión
          </button>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--green)' }}>
            Possibility
            <span style={{ fontSize: 11, verticalAlign: 'super', fontWeight: 400 }}>®</span>
          </span>
          <span style={{ width: 1, height: 20, background: 'var(--line)' }} />
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
            Bienvenido, <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{user?.name}</span>
          </p>
          <button className="ic-btn" title="Ajustes del suministro" onClick={onOpenSettings}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <button className="ic-btn" title="Cerrar sesión" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
        <select className="ps" value={activeId} onChange={(e) => onSelect(e.target.value)}>
          {supplies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
