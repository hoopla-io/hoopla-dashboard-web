import { httpClient } from "@/lib/api/http-client";
import type {
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationTranslation,
  CreateTranslationRequest,
  UpdateTranslationRequest,
} from "@/lib/api/schemas/notifications";
import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const notificationsApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Notification>> => {
    const response = await httpClient.get<ApiResponse<Notification[]>>("/api/v1/notification/list", { params });
    return response.data;
  },

  getById: async (id: number): Promise<Notification> => {
    const response = await httpClient.get<ApiResponse<Notification>>(`/api/v1/notification/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateNotificationRequest, file?: File): Promise<Notification> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("text", data.text);
    if (data.url) formData.append("url", data.url);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<Notification>>("/api/v1/notification/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateNotificationRequest, file?: File): Promise<Notification> => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.text) formData.append("text", data.text);
    if (data.url) formData.append("url", data.url);
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<Notification>>(`/api/v1/notification/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/notification/delete/${id}`);
  },
};

export const translationsApi = {
  create: async (data: CreateTranslationRequest, file?: File): Promise<NotificationTranslation> => {
    const formData = new FormData();
    formData.append("notification_id", String(data.notification_id));
    formData.append("language", data.language);
    if (data.title) formData.append("title", data.title);
    if (data.text) formData.append("text", data.text);
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<NotificationTranslation>>(
      "/api/v1/notification/translation/store",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateTranslationRequest, file?: File): Promise<NotificationTranslation> => {
    const formData = new FormData();
    if (data.language) formData.append("language", data.language);
    if (data.title) formData.append("title", data.title);
    if (data.text) formData.append("text", data.text);
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<NotificationTranslation>>(
      `/api/v1/notification/translation/edit/${id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/notification/translation/delete/${id}`);
  },
};
