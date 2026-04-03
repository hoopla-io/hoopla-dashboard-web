import { httpClient } from "@/lib/api/http-client";
import type {
  Drink, CreateDrinkRequest,
  PartnerDrink, CreatePartnerDrinkRequest, UpdatePartnerDrinkRequest,
  PartnerDrinkModifier, CreatePartnerDrinkModifierRequest, UpdatePartnerDrinkModifierRequest,
  DrinkCategory, CategoryWithDrinks, CreateCategoryRequest, UpdateCategoryRequest, LinkDrinkRequest,
} from "@/lib/api/schemas/drinks";



import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const drinksApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Drink>> => {
    const response = await httpClient.get<ApiResponse<Drink[]>>("/api/v1/drink/list", { params });
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

  getByPartner: async (partnerId: number): Promise<PartnerDrink[]> => {
    const response = await httpClient.get<ApiResponse<PartnerDrink[]>>(`/api/v1/partner/drink/list/${partnerId}`);
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

  getPartnerDrinkById: async (id: number): Promise<PartnerDrink> => {
    const response = await httpClient.get<ApiResponse<PartnerDrink>>(`/api/v1/partner/drink/show/${id}`);
    return response.data.data ?? response.data;
  },

  deletePartnerDrink: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/drink/delete/${id}`);
  },

  // --- Drink Modifiers ---
  listModifiers: async (partnerDrinkId: number, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<PartnerDrinkModifier>> => {
    const response = await httpClient.get<ApiResponse<PartnerDrinkModifier[]>>(`/api/v1/partner/drink/modifier/list/${partnerDrinkId}`, { params });
    return response.data;
  },

  getModifierById: async (id: number): Promise<PartnerDrinkModifier> => {
    const response = await httpClient.get<ApiResponse<PartnerDrinkModifier>>(`/api/v1/partner/drink/modifier/show/${id}`);
    return response.data.data ?? response.data;
  },

  createModifier: async (data: CreatePartnerDrinkModifierRequest): Promise<PartnerDrinkModifier> => {
    const response = await httpClient.post<ApiResponse<PartnerDrinkModifier>>("/api/v1/partner/drink/modifier/store", data);
    return response.data.data ?? response.data;
  },

  updateModifier: async (id: number, data: UpdatePartnerDrinkModifierRequest): Promise<PartnerDrinkModifier> => {
    const response = await httpClient.put<ApiResponse<PartnerDrinkModifier>>(`/api/v1/partner/drink/modifier/edit/${id}`, data);
    return response.data.data ?? response.data;
  },

  deleteModifier: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/drink/modifier/delete/${id}`);
  },
};

export const categoryApi = {
  getAll: async (partnerId: number): Promise<DrinkCategory[]> => {
    const response = await httpClient.get<ApiResponse<DrinkCategory[]>>(`/api/v1/partner/category/list/${partnerId}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<CategoryWithDrinks> => {
    const response = await httpClient.get<ApiResponse<CategoryWithDrinks>>(`/api/v1/partner/category/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<{ categoryId: number }> => {
    const response = await httpClient.post<ApiResponse<{ categoryId: number }>>("/api/v1/partner/category/store", data);
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateCategoryRequest): Promise<void> => {
    await httpClient.put(`/api/v1/partner/category/edit/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/category/delete/${id}`);
  },

  linkDrink: async (data: LinkDrinkRequest): Promise<void> => {
    await httpClient.post("/api/v1/partner/category/link", data);
  },

  unlinkDrink: async (partnerDrinkId: number, categoryId: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/category/unlink/${partnerDrinkId}/${categoryId}`);
  },
};
