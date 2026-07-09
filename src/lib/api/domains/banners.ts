import { httpClient } from "@/lib/api/http-client";
import type { Banner, CreateBannerRequest, UpdateBannerRequest } from "@/lib/api/schemas/banners";
import type { PaginatedResponse, ApiResponse, SortParams } from "@/lib/api/types";

function buildFormData(data: Partial<CreateBannerRequest>, file?: File): FormData {
  const formData = new FormData();
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.link_type) formData.append("link_type", data.link_type);
  if (data.link_value !== undefined) formData.append("link_value", data.link_value);
  if (data.position) formData.append("position", data.position);
  if (data.partner_id !== undefined) formData.append("partner_id", String(data.partner_id));
  if (data.sort_order !== undefined) formData.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));
  if (data.start_date) formData.append("start_date", data.start_date);
  if (data.end_date) formData.append("end_date", data.end_date);
  if (file) formData.append("file", file);
  return formData;
}

export const bannersApi = {
  getAll: async (params?: { page?: number; limit?: number; position?: string } & SortParams): Promise<PaginatedResponse<Banner>> => {
    const response = await httpClient.get<ApiResponse<Banner[]>>("/api/v1/banner/list", { params });
    return response.data;
  },

  getById: async (id: number): Promise<Banner> => {
    const response = await httpClient.get<ApiResponse<Banner>>(`/api/v1/banner/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateBannerRequest, file?: File): Promise<Banner> => {
    const formData = buildFormData(data, file);
    const response = await httpClient.post<ApiResponse<Banner>>("/api/v1/banner/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateBannerRequest, file?: File): Promise<Banner> => {
    const formData = buildFormData(data, file);
    const response = await httpClient.put<ApiResponse<Banner>>(`/api/v1/banner/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/banner/delete/${id}`);
  },
};
