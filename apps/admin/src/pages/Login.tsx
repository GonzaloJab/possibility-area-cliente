import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@possibility.com');
  const [password, setPassword] = useState('possibility-admin');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/clients" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/clients');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
          Possibility<span style={{ fontSize: 11, verticalAlign: 'super', fontWeight: 400 }}>®</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', padding: '2px 8px', borderRadius: 6, background: '#F0F3EE' }}>pipe</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, letterSpacing: '-.02em', marginTop: 18 }}>Panel de administración</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, marginTop: 6 }}>
          Solo cuentas con rol de administrador.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
