import { httpClient } from "@/lib/api/http-client";
import type { ApiResponse, PaginatedResponse, SortParams } from "@/lib/api/types";
import type {
  Category,
  CategoryLanguage,
  CategoryTranslationInput,
  SaveCategoryRequest,
} from "@/lib/api/schemas/categories";

export const categoriesApi = {
  getAll: async (
    params?: { page?: number; limit?: number; search?: string } & SortParams
  ): Promise<PaginatedResponse<Category>> => {
    const response = await httpClient.get<ApiResponse<Category[]>>("/api/v1/category/list", { params });
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await httpClient.get<ApiResponse<Category>>(`/api/v1/category/show/${id}`);
    return response.data.data;
  },

  create: async (data: SaveCategoryRequest): Promise<{ id: number }> => {
    const response = await httpClient.post<ApiResponse<{ id: number }>>("/api/v1/category/store", data);
    return response.data.data;
  },

  update: async (id: number, data: SaveCategoryRequest): Promise<void> => {
    await httpClient.put(`/api/v1/category/edit/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/category/delete/${id}`);
  },

  addTranslation: async (categoryId: number, data: CategoryTranslationInput): Promise<{ id: number }> => {
    const response = await httpClient.post<ApiResponse<{ id: number }>>(
      `/api/v1/category/${categoryId}/translation`,
      data
    );
    return response.data.data;
  },

  updateTranslation: async (
    categoryId: number,
    language: CategoryLanguage,
    data: Omit<CategoryTranslationInput, "language">
  ): Promise<void> => {
    await httpClient.put(`/api/v1/category/${categoryId}/translation/${language}`, data);
  },

  removeTranslation: async (categoryId: number, language: Exclude<CategoryLanguage, "ru">): Promise<void> => {
    await httpClient.delete(`/api/v1/category/${categoryId}/translation/${language}`);
  },
};
