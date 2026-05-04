import { useMemo } from 'react';
import type { Supply } from '../types';

interface Props { supply: Supply; }

const COMPETITORS_FACTOR = [1, 1.18, 1.32, 1.48, 1.62];
const COMPETITORS_NAMES = ['Contigo Energía', 'EnerVerde', 'SolNatural', 'LuzPlena', 'EcoWatt'];

export function ResumenTab({ supply }: Props) {
  const lastInvoice = supply.invoices?.[0];
  const baseMonthly = Number(supply.tariff?.monthlyBaseCost ?? 78);

  const yourYearlyCost = supply.consumption?.reduce((sum, c) => sum + Number(c.totalKwh), 0) ?? 0;
  const yourCostEur = Math.round(yourYearlyCost * Number(supply.tariff?.pricePerKwh ?? 0.089));
  const marketCost = yourCostEur * 2;
  const savings = marketCost - yourCostEur;

  const monthlyCosts = useMemo(
    () => supply.consumption?.map((c) => Math.round(Number(c.totalKwh) * Number(supply.tariff?.pricePerKwh ?? 0.089))) ?? [],
    [supply],
  );
  const maxMonthly = Math.max(...monthlyCosts, 1);

  const competitors = COMPETITORS_FACTOR.map((f, i) => ({
    name: COMPETITORS_NAMES[i],
    monthly: Math.round(baseMonthly * f),
    perKwh: ((baseMonthly * (f === 1 ? 1 : f + 0.03)) / 720).toFixed(4),
    you: i === 0,
  }));
  const maxComp = Math.max(...competitors.map((c) => c.monthly));

  return (
    <div className="grid3">
      <div className="pc" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(26,107,26,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="var(--green)" strokeWidth="1.5">
                <path d="M4 2h12a1 1 0 011 1v14l-2.5-1.5L12 17l-2.5-1.5L7 17l-2.5-1.5L2 17V3a1 1 0 011-1z" />
                <path d="M7 6h6M7 9h4" />
              </svg>
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Última factura</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 5 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, letterSpacing: '-.02em', lineHeight: 1 }}>
              {lastInvoice ? Number(lastInvoice.amount).toFixed(2).replace('.', ',') : '—'}
            </span>
            <span style={{ fontSize: 20, color: 'var(--muted)', fontWeight: 300 }}>€</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
            {lastInvoice?.period} · {lastInvoice?.number}
          </p>
          <span className="bd">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l4 4 6-7" /></svg>
            Pagada
          </span>
        </div>
        <button className="pb" style={{ marginTop: 18 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v9M4 8l4 4 4-4M2 13h12" /></svg>
          Descargar PDF
        </button>
      </div>

      <div className="pc" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(45,138,45,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2D8A2D" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Ahorro 2026 vs mercado</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 14 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, letterSpacing: '-.02em', color: 'var(--green)', lineHeight: 1 }}>
            {savings.toLocaleString('es-ES')}
          </span>
          <span style={{ fontSize: 20, color: 'var(--muted)', fontWeight: 300 }}>€</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44, marginBottom: 14 }}>
          {monthlyCosts.map((v, i) => {
            const h = (v / maxMonthly) * 100;
            const last = i === monthlyCosts.length - 1;
            return <div key={i} style={{ flex: 1, height: `${h}%`, background: last ? 'var(--green)' : 'var(--green-bg)', borderRadius: 3, minHeight: 4 }} />;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 12 }}>
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: 2 }}>Tu coste</p>
            <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 14 }}>{yourCostEur.toLocaleString('es-ES')} €</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--muted)', marginBottom: 2 }}>Media mercado</p>
            <p style={{ fontWeight: 500, color: 'var(--muted)', fontSize: 14, textDecoration: 'line-through' }}>
              {marketCost.toLocaleString('es-ES')} €
            </p>
          </div>
        </div>
      </div>

      <div className="pc" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(26,107,26,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 17l4-4 4 4 5-5" /></svg>
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Tu tarifa vs competencia</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16, fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
          <span className="live" />
          Monitorización activa · revisamos tu factura cada mes
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 120, marginBottom: 12 }}>
          {competitors.map((c) => {
            const h = (c.monthly / maxComp) * 100;
            return (
              <div key={c.name} className={`bw ${c.you ? 'y' : ''}`}>
                <div className="tt">{c.perKwh}€/kWh</div>
                <span style={{ fontSize: 11, fontWeight: c.you ? 500 : 400, color: c.you ? 'var(--green)' : 'var(--ink)' }}>
                  {c.monthly}€
                </span>
                <div className="bs" style={{ width: '100%', height: `${h}%`, background: c.you ? 'var(--green)' : '#E5EBE2', borderRadius: '7px 7px 0 0', minHeight: 8, transition: 'background .2s' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          {competitors.map((c) => (
            <span key={c.name} style={{ flex: 1, fontSize: 10, textAlign: 'center', fontWeight: c.you ? 500 : 400, color: c.you ? 'var(--green)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
