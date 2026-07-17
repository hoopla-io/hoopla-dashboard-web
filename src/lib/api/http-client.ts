import axios from "axios";

import { useAuthStore } from "@/stores/auth-store";

export const API_BASE_URL = "https://dashboard.hoopla.uz";

export const httpClient = axios.create({
  baseURL:  API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
