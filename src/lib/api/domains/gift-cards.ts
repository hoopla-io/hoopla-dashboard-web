import { httpClient } from "@/lib/api/http-client";
import type {
  GiftCard,
  GiftCardDetail,
  CreateGiftCardRequest,
} from "@/lib/api/schemas/gift-cards";
import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const giftCardsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    code?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<GiftCard>> => {
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
