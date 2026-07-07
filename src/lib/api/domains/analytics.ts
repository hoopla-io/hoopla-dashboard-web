import { httpClient } from "@/lib/api/http-client";
import type { ApiResponse } from "@/lib/api/types";
import type { PartnerAnalytics } from "@/lib/api/schemas/analytics";

export interface PartnerAnalyticsParams {
  from?: string;
  to?: string;
  limit?: number;
}

export const analyticsApi = {
  getByPartner: async (partnerId: number, params?: PartnerAnalyticsParams): Promise<PartnerAnalytics> => {
    const response = await httpClient.get<ApiResponse<PartnerAnalytics>>(
      `/api/v1/partner/analytics/${partnerId}`,
      { params },
    );
    return response.data.data ?? response.data;
  },
};
