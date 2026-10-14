import { httpClient } from "@/lib/api/http-client";
import type { ApiResponse } from "@/lib/api/types";
import type { DashboardStats, OrdersAnalytics, PartnerAnalytics } from "@/lib/api/schemas/analytics";

export interface PartnerAnalyticsParams {
  from?: string;
  to?: string;
  limit?: number;
}

export interface OrdersAnalyticsParams {
  from?: string;
  to?: string;
  partner_id?: number;
  shop_id?: number;
  source?: string;
  include_test?: boolean;
}

export const analyticsApi = {
  getByPartner: async (partnerId: number, params?: PartnerAnalyticsParams): Promise<PartnerAnalytics> => {
    const response = await httpClient.get<ApiResponse<PartnerAnalytics>>(
      `/api/v1/partner/analytics/${partnerId}`,
      { params },
    );
    return response.data.data ?? response.data;
  },

  getOrders: async (params?: OrdersAnalyticsParams): Promise<OrdersAnalytics> => {
    const response = await httpClient.get<ApiResponse<OrdersAnalytics>>("/api/v1/orders/analytics", {
      params,
    });
    return response.data.data ?? response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await httpClient.get<ApiResponse<DashboardStats>>("/api/v1/dashboard/stats");
    return response.data.data;
  },
};
