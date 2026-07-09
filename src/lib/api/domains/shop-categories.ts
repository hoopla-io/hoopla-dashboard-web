import { httpClient } from "@/lib/api/http-client";
import type {
  ShopCategory,
  ShopCategoryWithPartners,
  CreateShopCategoryRequest,
  UpdateShopCategoryRequest,
  LinkPartnerRequest,
} from "@/lib/api/schemas/shop-categories";
import type { PaginatedResponse, ApiResponse, SortParams } from "@/lib/api/types";

function buildFormData(data: Partial<CreateShopCategoryRequest>, file?: File): FormData {
  const formData = new FormData();
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.sort_order !== undefined) formData.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));
  if (file) formData.append("file", file);
  return formData;
}

export const shopCategoriesApi = {
  getAll: async (params?: { page?: number; limit?: number } & SortParams): Promise<PaginatedResponse<ShopCategory>> => {
    const response = await httpClient.get<ApiResponse<ShopCategory[]>>("/api/v1/shop-category/list", { params });
    return response.data;
  },

  getById: async (id: number): Promise<ShopCategoryWithPartners> => {
    const response = await httpClient.get<ApiResponse<ShopCategoryWithPartners>>(`/api/v1/shop-category/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateShopCategoryRequest, file?: File): Promise<ShopCategory> => {
    const formData = buildFormData(data, file);
    const response = await httpClient.post<ApiResponse<ShopCategory>>("/api/v1/shop-category/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateShopCategoryRequest, file?: File): Promise<ShopCategory> => {
    const formData = buildFormData(data, file);
    const response = await httpClient.put<ApiResponse<ShopCategory>>(`/api/v1/shop-category/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop-category/delete/${id}`);
  },

  linkPartner: async (data: LinkPartnerRequest): Promise<void> => {
    await httpClient.post("/api/v1/shop-category/link", data);
  },

  unlinkPartner: async (partnerId: number, categoryId: number): Promise<void> => {
    await httpClient.delete(`/api/v1/shop-category/unlink/${partnerId}/${categoryId}`);
  },
};
