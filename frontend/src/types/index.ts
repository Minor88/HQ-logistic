export type User = {
  id: number;
  username: string;
  email: string;
  company: number;
  phone: string;
  name: string;
  comment: string;
  user_group: 'superuser' | 'admin' | 'boss' | 'manager' | 'warehouse' | 'client';
  is_active: boolean;
};

export type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
};

export type Shipment = {
  id: number;
  number: string;
  company: number;
  status: string;
  comment: string;
  created_at: string;
  created_by: number;
  files: ShipmentFile[];
};

export type ShipmentFile = {
  id: number;
  file: string;
  name: string;
  folder: string | null;
  uploaded_at: string;
};

export type Request = {
  id: number;
  number: string;
  company: number;
  description: string;
  warehouse_number: string | null;
  col_mest: number;
  declared_weight: number;
  declared_volume: number;
  actual_weight: number | null;
  actual_volume: number | null;
  rate: {
    base: number;
    additional: number;
  } | null;
  comment: string;
  status: string;
  client: number;
  manager: number | null;
  shipment: number | null;
  created_at: string;
  files: RequestFile[];
};

export type RequestFile = {
  id: number;
  file: string;
  name: string;
  uploaded_at: string;
};

export type FinanceOperation = {
  number: string;
  company: number;
  operation_type: 'incoming' | 'outgoing';
  payment_date: string;
  document_type: 'invoice' | 'payment';
  currency: 'rub' | 'usd' | 'eur';
  counterparty: string;
  article: number;
  amount: number;
  shipment: number | null;
  request: number | null;
  basis: string | null;
  is_paid: boolean;
  created_by: number;
  created_at: string;
}; 