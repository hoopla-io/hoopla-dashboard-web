// Settlement types. Money fields (total_amount, price, payout, *_som) are in SOM
// (the backend converts from the stored tiyin at the response boundary).

export interface Settlement {
  id: number;
  partner_id: number;
  partner_name?: string;
  shop_id?: number | null;
  shop_name?: string | null;
  period_start: string;
  period_end: string;
  total_amount: number; // som
  orders_count: number;
  status: string; // "pending" | "paid"
  paid_at?: string | null;
  created_at: string;
}

export interface SettlementOrder {
  id: number;
  status: string;
  price: number; // gross som
  payout: number; // som Hoopla owes the partner
  drink_name?: string;
  shop_id?: number;
  shop_name?: string;
  created_at: string;
  settlement_id?: number | null;
  hoopla_paid?: boolean;
}

export interface SettlementShow extends Settlement {
  orders: SettlementOrder[];
}

export interface SettlementOrdersSummary {
  orders_count: number;
  gross_som: number;
  payout_som: number;
  paid_count: number;
  unpaid_count: number;
  // Orders with no settlement batch yet — what a new batch would actually settle.
  unsettled_count: number;
}

export interface CreateSettlementRequest {
  partner_id: number;
  shop_id?: number | null;
  period_start: string; // RFC3339
  period_end: string; // RFC3339
}

export type SettlementPayment = "all" | "paid" | "unpaid";
export type SettlementStatus = "all" | "pending" | "paid";
