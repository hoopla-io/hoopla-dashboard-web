import { httpClient } from "@/lib/api/http-client";
import type { Order, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";



import type { PaginatedResponse, ApiResponse, PaginationParams, SortParams } from "@/lib/api/types";

export interface OrdersGetAllParams extends PaginationParams, SortParams {
  status?: string;
  drink?: string;
  time?: string;
  from?: string;
  to?: string;
  shop?: string;
  search?: string;
  partner_id?: number;
  shop_id?: number;
  source?: string;
  payment?: string;
  // Include orders placed against test-type partners (excluded by default).
  include_test?: boolean;
}

export const ordersApi = {
  getAll: async (params?: OrdersGetAllParams): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>("/api/v1/orders/list", {
      params,
    });
    return response.data;
  },

  exportExcel: async (params?: OrdersGetAllParams): Promise<{ blob: Blob; filename: string }> => {
    const response = await httpClient.get("/api/v1/orders/export", {
      params,
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const match = disposition ? /filename="?([^";]+)"?/i.exec(disposition) : null;
    return { blob: response.data as Blob, filename: match ? match[1] : "orders.xlsx" };
  },

  getByPartner: async (partnerId: number): Promise<Order[]> => {
    const response = await httpClient.get<ApiResponse<Order[]>>(`/api/v1/partner/orders/${partnerId}`);
    return response.data.data || [];
  },

  getByShop: async (shopId: number, params?: OrdersGetAllParams): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>(`/api/v1/shop/orders/${shopId}`, {
      params,
    });
    return response.data;
  },

  changeStatus: async (data: ChangeOrderStatusRequest): Promise<void> => {
    await httpClient.put(`/api/v1/orders/edit/${data.id}`, { status: data.status });
  },

  fiscalize: async (orderId: number): Promise<void> => {
    await httpClient.post(`/api/v1/orders/${orderId}/fiscalize`);
  },
};
