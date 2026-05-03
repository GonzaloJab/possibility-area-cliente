import { useEffect, useMemo, useState } from 'react';
import type { Supply } from '../types';
import { api } from '../lib/api';
import { Header } from '../components/Header';
import { HeroBanner } from '../components/HeroBanner';
import { ResumenTab } from '../components/ResumenTab';
import { ConsumoTab } from '../components/ConsumoTab';
import { FacturasTab } from '../components/FacturasTab';
import { TarifaTab } from '../components/TarifaTab';
import { SettingsModal } from '../components/SettingsModal';
import { ShipmentBooster } from '../components/ShipmentBooster';

export type TabKey = 'resumen' | 'consumo' | 'facturas' | 'tarifa';

export function Dashboard() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSupply, setActiveSupply] = useState<Supply | null>(null);
  const [tab, setTab] = useState<TabKey>('resumen');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load supplies list
  useEffect(() => {
    api
      .supplies()
      .then(({ supplies }) => {
        setSupplies(supplies);
        if (supplies.length > 0) setActiveId(supplies[0].id);
      })
      .catch((e) => setError(e.message ?? 'No se pudieron cargar los suministros'));
  }, []);

  // Load full detail when active changes
  useEffect(() => {
    if (!activeId) return;
    api
      .supply(activeId)
      .then(({ supply }) => setActiveSupply(supply))
      .catch((e) => setError(e.message ?? 'Error cargando el suministro'));
  }, [activeId]);

  const supplyOptions = useMemo(
    () => supplies.map((s) => ({ id: s.id, label: `${s.alias} — ${s.address}` })),
    [supplies],
  );

  if (error) return <div className="loading">{error}</div>;
  if (!activeSupply) return <div className="loading">Cargando tu cuenta…</div>;

  return (
    <div className="wrap">
      <Header
        supplies={supplyOptions}
        activeId={activeId!}
        onSelect={setActiveId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <HeroBanner supply={activeSupply} activeTab={tab} onTabChange={setTab} />

      {tab === 'resumen' && <ResumenTab supply={activeSupply} />}
      {tab === 'consumo' && <ConsumoTab supply={activeSupply} />}
      {tab === 'facturas' && <FacturasTab supply={activeSupply} />}
      {tab === 'tarifa' && <TarifaTab supply={activeSupply} />}

      <ShipmentBooster />

      <SettingsModal
        supply={activeSupply}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
