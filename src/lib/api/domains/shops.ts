import { httpClient } from "@/lib/api/http-client";
import type { Shop, CreateShopRequest, ShopAttribute, ShopHours, CreateShopHoursRequest, ShopPicture } from "@/lib/api/schemas/shops";



import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const shopsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; partner_id?: number }): Promise<PaginatedResponse<Shop>> => {
    const response = await httpClient.get<ApiResponse<Shop[]>>("/api/v1/shop/list", {
      params,
    });
    return response.data;
  },

  getByPartner: async (partnerId: number): Promise<Shop[]> => {
    const response = await httpClient.get<ApiResponse<Shop[]>>(`/api/v1/partner/shop/list/${partnerId}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Shop> => {
    const response = await httpClient.get<ApiResponse<Shop>>(`/api/v1/shop/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateShopRequest, file?: File): Promise<Shop> => {
    const formData = new FormData();
    formData.append("partner_id", String(data.partner_id));
    formData.append("name", data.name);
    formData.append("location_lat", String(data.location_lat));
    formData.append("location_long", String(data.location_long));
    if (data.vendor_terminal_id) formData.append("vendor_terminal_id", data.vendor_terminal_id);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<Shop>>("/api/v1/shop/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: Partial<CreateShopRequest>, file?: File): Promise<Shop> => {
    const formData = new FormData();
    if (data.partner_id) formData.append("partner_id", String(data.partner_id));
    if (data.name) formData.append("name", data.name);
    if (data.location_lat) formData.append("location_lat", String(data.location_lat));
    if (data.location_long) formData.append("location_long", String(data.location_long));
    if (data.vendor_terminal_id) formData.append("vendor_terminal_id", data.vendor_terminal_id);
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<Shop>>(`/api/v1/shop/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop/delete/${id}`);
  },

  getAttributes: async (shopId: number): Promise<ShopAttribute[]> => {
    const response = await httpClient.get<ApiResponse<ShopAttribute[]>>(`/api/v1/shop/attribute/list/${shopId}`);
    return response.data.data || [];
  },

  getHours: async (shopId: number): Promise<ShopHours[]> => {
    const response = await httpClient.get<ApiResponse<ShopHours[]>>(`/api/v1/shop/hours/list/${shopId}`);
    return response.data.data || [];
  },

  createHours: async (data: CreateShopHoursRequest): Promise<ShopHours> => {
    const formData = new FormData();
    formData.append("shop_id", String(data.shop_id));
    formData.append("week_day", data.week_day);
    formData.append("open_at", data.open_at);
    formData.append("close_at", data.close_at);

    const response = await httpClient.post<ApiResponse<ShopHours>>("/api/v1/shop/hours/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  deleteHours: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop/hours/delete/${id}`);
  },

  getPictures: async (shopId: number): Promise<ShopPicture[]> => {
    const response = await httpClient.get<ApiResponse<ShopPicture[]>>(`/api/v1/shop/picture/list/${shopId}`);
    return response.data.data || [];
  },

  uploadPicture: async (shopId: number, file: File): Promise<ShopPicture> => {
    const formData = new FormData();
    formData.append("shop_id", String(shopId));
    formData.append("file", file);

    const response = await httpClient.post<ApiResponse<ShopPicture>>("/api/v1/shop/picture/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  deletePicture: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop/picture/delete/${id}`);
  },
};
