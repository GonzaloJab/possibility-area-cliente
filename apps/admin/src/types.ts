export type SupplyType = 'RESIDENCIAL' | 'RESTAURACION' | 'EMPRESA';
export type InvoiceStatus = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';
export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
}

export interface Tariff {
  id: string;
  supplyId: string;
  pricePerKwh: string;
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
  supplier?: string | null;
  tariff?: Tariff | null;
  invoices?: Invoice[];
  consumption?: Consumption[];
}

export interface ClientSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  suppliesCount: number;
  lastInvoiceAt: string | null;
  createdAt: string;
}

export interface ClientDetail {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  supplies: Supply[];
}

export interface OcrPreview {
  filename: string;
  isStub: boolean;
  extracted: {
    number?: string | null;
    period?: string | null;
    issued_at?: string | null;
    amount?: string | null;
    cups?: string | null;
    address?: string | null;
    supplier?: string | null;
    price_per_kwh?: string | null;
    contracted_power?: string | null;
    contract_name?: string | null;
    total_kwh?: string | null;
    extra_fields?: Record<string, unknown>;
    confidence?: number | null;
  };
  rawOcr: Record<string, unknown>;
}

export interface InvoiceImportItem {
  number: string;
  period: string;
  issuedAt: string;
  amount: string;
  status: InvoiceStatus;
  supplier?: string | null;
  rawOcr?: Record<string, unknown> | null;
  pdfUrl?: string | null;
}
