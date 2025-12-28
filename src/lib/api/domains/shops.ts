import { httpClient } from "@/lib/api/http-client";
import type { Shop, CreateShopRequest, ShopAttribute, ShopHours, CreateShopHoursRequest, ShopPicture } from "@/lib/api/schemas/shops";

type ApiResponse<T> = {
  data: T;
  message?: string;
  code?: number;
};

export const shopsApi = {
  // Shops
  getAll: async (): Promise<Shop[]> => {
    const response = await httpClient.get<ApiResponse<Shop[]>>("/api/v1/shop/list");
    return response.data.data ?? response.data;
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
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<Shop>>(`/api/v1/shop/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop/delete/${id}`);
  },

  // Shop Attributes
  getAttributes: async (shopId: number): Promise<ShopAttribute[]> => {
    const response = await httpClient.get<ApiResponse<ShopAttribute[]>>(`/api/v1/shop/attribute/list/${shopId}`);
    return response.data.data ?? response.data;
  },

  // Shop Hours
  getHours: async (shopId: number): Promise<ShopHours[]> => {
    const response = await httpClient.get<ApiResponse<ShopHours[]>>(`/api/v1/shop/hours/list/${shopId}`);
    return response.data.data ?? response.data;
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

  // Shop Pictures
  getPictures: async (shopId: number): Promise<ShopPicture[]> => {
    const response = await httpClient.get<ApiResponse<ShopPicture[]>>(`/api/v1/shop/picture/list/${shopId}`);
    return response.data.data ?? response.data;
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
