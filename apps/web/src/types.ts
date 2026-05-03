export type SupplyType = 'RESIDENCIAL' | 'RESTAURACION' | 'EMPRESA';
export type InvoiceStatus = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Tariff {
  id: string;
  supplyId: string;
  pricePerKwh: string; // Decimal serialized as string
  monthlyBaseCost: string;
  marketAvgPercent: number;
  contractName: string;
}

export interface Invoice {
  id: string;
  supplyId: string;
  number: string;
  period: string;
  issuedAt: string;
  amount: string;
  status: InvoiceStatus;
  pdfUrl: string | null;
}

export interface Consumption {
  id: string;
  supplyId: string;
  year: number;
  month: number;
  totalKwh: string;
  changePercent: number;
  hourlyProfile: number[];
}

export interface Supply {
  id: string;
  alias: string;
  address: string;
  zone: string;
  subtitle: string;
  type: SupplyType;
  heroImageUrl: string | null;
  contractedPower: string;
  cups: string | null;
  tariff?: Tariff;
  invoices?: Invoice[];
  consumption?: Consumption[];
}
