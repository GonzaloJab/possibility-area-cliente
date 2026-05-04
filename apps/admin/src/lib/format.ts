export const formatEur = (v: string | number) =>
  Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES') : '—';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-ES');
