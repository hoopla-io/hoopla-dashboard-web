import { httpClient } from "@/lib/api/http-client";
import type { PushNotification, PushNotificationStats } from "@/lib/api/schemas/push-notifications";
import type { PaginatedResponse, ApiResponse, PaginationParams, SortParams } from "@/lib/api/types";

export interface PushNotificationsFilterParams {
  kind?: string;
  status?: string;
  search?: string;
  user_id?: number;
  reference_id?: number;
  from?: string;
  to?: string;
}

export interface PushNotificationsGetAllParams
  extends PaginationParams,
    SortParams,
    PushNotificationsFilterParams {}

export const pushNotificationsApi = {
  getAll: async (params?: PushNotificationsGetAllParams): Promise<PaginatedResponse<PushNotification>> => {
    const response = await httpClient.get<ApiResponse<PushNotification[]>>("/api/v1/push-notification/list", {
      params,
    });
    return response.data;
  },

  getStats: async (params?: PushNotificationsFilterParams): Promise<PushNotificationStats> => {
    const response = await httpClient.get<ApiResponse<PushNotificationStats>>("/api/v1/push-notification/stats", {
      params,
    });
    return response.data.data;
  },
};
