import { httpClient } from "@/lib/api/http-client";
import type { Shop, CreateShopRequest, ShopAttribute, ShopHours, CreateShopHoursRequest, ShopPicture, ShopDrink } from "@/lib/api/schemas/shops";



import type { PaginatedResponse, ApiResponse, SortParams } from "@/lib/api/types";

// Shared by create/update: billing (use_own_legal + TIN) and always_open/restock_time
// overrides. TIN fields are only sent when use_own_legal is on — otherwise the shop
// inherits the partner's legal/TIN info and the backend shouldn't receive stale values.
function appendOverrideFields(formData: FormData, data: Partial<CreateShopRequest>) {
  if (data.use_own_legal !== undefined) formData.append("use_own_legal", String(data.use_own_legal));
  if (data.use_own_legal) {
    if (data.tin_type) formData.append("tin_type", data.tin_type);
    if (data.tin_num) formData.append("tin_num", data.tin_num);
    if (data.tin_percent !== undefined) formData.append("tin_percent", String(data.tin_percent));
  }
  if (data.always_open !== undefined) formData.append("always_open", String(data.always_open));
}

export const shopsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; partner_id?: number } & SortParams): Promise<PaginatedResponse<Shop>> => {
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

  // Note: the backend's store response is a narrow { id, message, image_url? }
  // DTO, not a full Shop — fetch via getById if the complete record is needed after create.
  create: async (data: CreateShopRequest, file?: File): Promise<{ id: number; message?: string; image_url?: string }> => {
    const formData = new FormData();
    formData.append("partner_id", String(data.partner_id));
    formData.append("name", data.name);
    formData.append("location_lat", String(data.location_lat));
    formData.append("location_long", String(data.location_long));
    if (data.vendor_terminal_id) formData.append("vendor_terminal_id", data.vendor_terminal_id);
    if (data.vendor_login) formData.append("vendor_login", data.vendor_login);
    if (data.vendor_password) formData.append("vendor_password", data.vendor_password);
    if (data.vendor_organization_id) formData.append("vendor_organization_id", data.vendor_organization_id);
    appendOverrideFields(formData, data);
    // restock_time has no prior value to clear on create, so only send it when set.
    if (data.restock_time) formData.append("restock_time", data.restock_time);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<{ id: number; message?: string; image_url?: string }>>("/api/v1/shop/store", formData, {
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
    if (data.vendor_login) formData.append("vendor_login", data.vendor_login);
    if (data.vendor_password) formData.append("vendor_password", data.vendor_password);
    if (data.vendor_organization_id) formData.append("vendor_organization_id", data.vendor_organization_id);
    if (data.status !== undefined) formData.append("status", String(data.status));
    appendOverrideFields(formData, data);
    // On edit, an explicit "" clears a previously-set restock time.
    if (data.restock_time !== undefined) formData.append("restock_time", data.restock_time);
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

  // Per-shop menu: the partner's drinks as they appear at this specific shop,
  // including the disable override and the POS-reported out-of-stock state.
  getDrinks: async (shopId: number): Promise<ShopDrink[]> => {
    const response = await httpClient.get<ApiResponse<ShopDrink[]> | ShopDrink[]>(`/api/v1/shops/${shopId}/drinks`);
    const body = response.data;
    return Array.isArray(body) ? body : body.data || [];
  },

  setDrinkDisabled: async (shopId: number, partnerDrinkId: number, disabled: boolean): Promise<void> => {
    await httpClient.post(`/api/v1/shops/${shopId}/drinks/${partnerDrinkId}/disable`, { disabled });
  },
};
