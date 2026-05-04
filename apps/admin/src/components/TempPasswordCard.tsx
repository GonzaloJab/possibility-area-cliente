import { useState } from 'react';

export function TempPasswordCard({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="copy-card">
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          Contraseña temporal para {email}
        </div>
        <div className="pw">{password}</div>
      </div>
      <button className="btn outline sm" onClick={copy}>
        {copied ? 'Copiada ✓' : 'Copiar'}
      </button>
    </div>
  );
}
