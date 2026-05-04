import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          Possibility<span style={{ fontSize: 11, verticalAlign: 'super', fontWeight: 400 }}>®</span>
          <span className="pipe">pipe</span>
        </div>
        <nav>
          <NavLink to="/clients" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="M20 8v6M23 11h-6" />
            </svg>
            Clientes
          </NavLink>
          <NavLink to="/clients/new" className={({ isActive }) => (isActive ? 'active' : '')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Onboarding
          </NavLink>
        </nav>
        <div className="footer">
          <div className="who">{user?.name}</div>
          <div>{user?.email}</div>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
