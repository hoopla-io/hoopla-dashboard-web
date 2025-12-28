import { httpClient } from "@/lib/api/http-client";
import type { LoginRequest, LoginResponse } from "@/lib/api/schemas/auth";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await httpClient.post<LoginResponse>("/api/v1/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await httpClient.get("/api/v1/auth/logout");
  },

  getMe: async () => {
    const response = await httpClient.get("/api/v1/users/get-me");
    return response.data;
  },
};
