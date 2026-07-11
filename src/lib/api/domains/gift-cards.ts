import { httpClient } from "@/lib/api/http-client";
import type {
  GiftCard,
  GiftCardDetail,
  CreateGiftCardRequest,
  BulkGiftCardRequest,
  BulkGiftCardResult,
} from "@/lib/api/schemas/gift-cards";
import type { PaginatedResponse, ApiResponse, SortParams } from "@/lib/api/types";

export const giftCardsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    code?: string;
    is_active?: boolean;
  } & SortParams): Promise<PaginatedResponse<GiftCard>> => {
    const response = await httpClient.get<ApiResponse<GiftCard[]>>(
      "/api/v1/gift-card/list",
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<GiftCardDetail> => {
    const response = await httpClient.get<ApiResponse<GiftCardDetail>>(
      `/api/v1/gift-card/show/${id}`
    );
    return response.data.data ?? response.data;
  },

  create: async (data: CreateGiftCardRequest): Promise<{ id: number }> => {
    const response = await httpClient.post<ApiResponse<{ id: number }>>(
      "/api/v1/gift-card/store",
      data
    );
    return response.data.data ?? response.data;
  },

  bulkCreate: async (
    data: BulkGiftCardRequest
  ): Promise<BulkGiftCardResult> => {
    const response = await httpClient.post<ApiResponse<BulkGiftCardResult>>(
      "/api/v1/gift-card/bulk",
      data
    );
    return response.data.data ?? response.data;
  },

  exportCsv: async (params?: {
    code?: string;
    is_active?: boolean;
  }): Promise<Blob> => {
    const response = await httpClient.get("/api/v1/gift-card/export", {
      params,
      responseType: "blob",
    });
    return response.data as Blob;
  },

  update: async (
    id: number,
    data: { is_active?: boolean; expires_at?: string; user_id?: number }
  ): Promise<void> => {
    await httpClient.put(`/api/v1/gift-card/edit/${id}`, data);
  },

  topUp: async (id: number, amount: number): Promise<void> => {
    await httpClient.post(`/api/v1/gift-card/topup/${id}`, { amount });
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/gift-card/delete/${id}`);
  },
};
