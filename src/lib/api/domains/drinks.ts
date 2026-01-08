import { httpClient } from "@/lib/api/http-client";
import type { Drink, CreateDrinkRequest, PartnerDrink, CreatePartnerDrinkRequest, UpdatePartnerDrinkRequest } from "@/lib/api/schemas/drinks";



import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const drinksApi = {
  getAll: async (): Promise<PaginatedResponse<Drink>> => {
    const response = await httpClient.get<ApiResponse<Drink[]>>("/api/v1/drink/list");
    return response.data;
  },

  getById: async (id: number): Promise<Drink> => {
    const response = await httpClient.get<ApiResponse<Drink>>(`/api/v1/drink/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateDrinkRequest, file?: File): Promise<Drink> => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<Drink>>("/api/v1/drink/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: Partial<CreateDrinkRequest>, file?: File): Promise<Drink> => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<Drink>>(`/api/v1/drink/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/drink/delete/${id}`);
  },

  // Partner Drinks
  getByPartner: async (partnerId: number): Promise<PartnerDrink[]> => {
    // Assuming endpoint based on patterns, user should verify
    const response = await httpClient.get<ApiResponse<PartnerDrink[]>>(`/api/v1/partner/drink/list`, {
        params: { partner_id: partnerId }
    });
    return response.data.data || [];
  },

  assignToPartner: async (data: CreatePartnerDrinkRequest, file?: File): Promise<PartnerDrink> => {
    const formData = new FormData();
    formData.append("partner_id", String(data.partner_id));
    formData.append("drink_id", String(data.drink_id));
    if (data.vendor_product_id) formData.append("vendor_product_id", data.vendor_product_id);
    if (data.product_price) formData.append("product_price", String(data.product_price));
    if (data.vendor_product_price) formData.append("vendor_product_price", String(data.vendor_product_price));
    if (data.vendor_product_name) formData.append("vendor_product_name", data.vendor_product_name);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<PartnerDrink>>("/api/v1/partner/drink/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  updatePartnerDrink: async (id: number, data: UpdatePartnerDrinkRequest, file?: File): Promise<PartnerDrink> => {
    const formData = new FormData();
    if (data.vendor_product_id) formData.append("vendor_product_id", data.vendor_product_id);
    if (data.product_price) formData.append("product_price", String(data.product_price));
    if (data.vendor_product_price) formData.append("vendor_product_price", String(data.vendor_product_price));
    if (data.vendor_product_name) formData.append("vendor_product_name", data.vendor_product_name);
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<PartnerDrink>>(`/api/v1/partner/drink/edit/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data ?? response.data;
  },

  deletePartnerDrink: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/drink/delete/${id}`);
  },
};
