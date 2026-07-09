import { httpClient } from "@/lib/api/http-client";
import type { ApiResponse, PaginatedResponse, PaginationParams, SortParams } from "@/lib/api/types";
import type {
  Settlement,
  SettlementShow,
  SettlementOrder,
  SettlementOrdersSummary,
  CreateSettlementRequest,
} from "@/lib/api/schemas/settlements";

export interface SettlementOrdersMeta {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  totalItems: number;
  summary: SettlementOrdersSummary;
}

export interface CreateSettlementResult {
  id: number;
  total_amount: number; // som
  orders_count: number;
  message: string;
}

export const settlementsApi = {
  list: async (
    params: PaginationParams & { partner_id?: number; shop_id?: number; status?: string } & SortParams
  ): Promise<PaginatedResponse<Settlement>> => {
    const res = await httpClient.get<ApiResponse<Settlement[]>>("/api/v1/settlement/list", { params });
    return res.data;
  },

  orders: async (params: {
    partner_id: number;
    shop_id?: number;
    period_start: string;
    period_end: string;
    payment?: string;
    page?: number;
    limit?: number;
  } & SortParams): Promise<{ data: SettlementOrder[]; meta: SettlementOrdersMeta | null }> => {
    const res = await httpClient.get<{ data: SettlementOrder[]; meta: SettlementOrdersMeta | null }>(
      "/api/v1/settlement/orders",
      { params }
    );
    return { data: res.data.data ?? [], meta: res.data.meta ?? null };
  },

  show: async (id: number): Promise<SettlementShow> => {
    const res = await httpClient.get<ApiResponse<SettlementShow>>(`/api/v1/settlement/show/${id}`);
    return res.data.data;
  },

  create: async (data: CreateSettlementRequest): Promise<CreateSettlementResult> => {
    const res = await httpClient.post<ApiResponse<CreateSettlementResult>>(
      "/api/v1/settlement/store",
      data
    );
    return res.data.data;
  },

  pay: async (id: number): Promise<void> => {
    await httpClient.put(`/api/v1/settlement/pay/${id}`);
  },

  remove: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/settlement/delete/${id}`);
  },
};
