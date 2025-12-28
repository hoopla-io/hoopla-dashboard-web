import { httpClient } from "@/lib/api/http-client";
import type { User, EditUserRequest, FilterUserRequest } from "@/lib/api/schemas/users";

type ApiResponse<T> = {
  data: T;
  message?: string;
  code?: number;
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await httpClient.get<ApiResponse<User[]>>("/api/v1/users/list");
    return response.data.data ?? response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await httpClient.get<ApiResponse<User>>(`/api/v1/users/show/${id}`);
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: EditUserRequest): Promise<User> => {
    const response = await httpClient.put<ApiResponse<User>>(`/api/v1/users/edit/${id}`, data);
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/users/delete/${id}`);
  },

  filter: async (filter: FilterUserRequest): Promise<User[]> => {
    const response = await httpClient.post<ApiResponse<User[]>>("/api/v1/users/filter", filter);
    return response.data.data ?? response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await httpClient.get<ApiResponse<User>>("/api/v1/users/get-me");
    return response.data.data ?? response.data;
  },
};
