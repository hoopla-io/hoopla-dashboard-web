import { httpClient } from "@/lib/api/http-client";
import type { ApiResponse, PaginatedResponse } from "@/lib/api/types";
import type { ShopEvent } from "@/lib/api/schemas/events";

export interface PartnerEventsParams {
  from?: string;
  to?: string;
  shop_ids?: string;
  types?: string;
  order_id?: number;
  page?: number;
  limit?: number;
}

export const eventsApi = {
  getByPartner: async (partnerId: number, params?: PartnerEventsParams): Promise<PaginatedResponse<ShopEvent>> => {
    const response = await httpClient.get<ApiResponse<ShopEvent[]>>(
      `/api/v1/partner/events/${partnerId}`,
      { params },
    );
    return response.data;
  },
};
