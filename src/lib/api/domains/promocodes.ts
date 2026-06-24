import { httpClient } from "@/lib/api/http-client";
import type {
  Promocode,
  CreatePromocodeRequest,
  UpdatePromocodeRequest,
} from "@/lib/api/schemas/promocodes";
import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const promocodesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    code?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Promocode>> => {
    const response = await httpClient.get<ApiResponse<Promocode[]>>(
      "/api/v1/promocode/list",
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<Promocode> => {
    const response = await httpClient.get<ApiResponse<Promocode>>(
      `/api/v1/promocode/show/${id}`
    );
    return response.data.data ?? response.data;
  },

  create: async (data: CreatePromocodeRequest): Promise<{ id: number }> => {
    const response = await httpClient.post<ApiResponse<{ id: number }>>(
      "/api/v1/promocode/store",
      data
    );
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdatePromocodeRequest): Promise<void> => {
    await httpClient.put(`/api/v1/promocode/edit/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/promocode/delete/${id}`);
  },
};
