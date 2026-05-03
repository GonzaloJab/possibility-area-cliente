import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('felipe@possibility.com');
  const [password, setPassword] = useState('possibility123');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.03em', color: 'var(--green)' }}>
          Possibility<span style={{ fontSize: 11, verticalAlign: 'super', fontWeight: 400 }}>®</span>
        </span>
        <h1 style={{ marginTop: 18 }}>Bienvenido</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
          Inicia sesión para gestionar tus suministros.
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
          <button className="pb" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
