import { httpClient } from "@/lib/api/http-client";
import type { Drink, CreateDrinkRequest } from "@/lib/api/schemas/drinks";



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
};
