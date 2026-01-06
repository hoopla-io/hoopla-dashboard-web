import { httpClient } from "@/lib/api/http-client";
import type { Order, OrderFilter, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";



import type { PaginatedResponse, ApiResponse, PaginationParams } from "@/lib/api/types";

export interface OrdersGetAllParams extends PaginationParams {
  status?: string;
  drink?: string;
  time?: string;
}

export const ordersApi = {
  getAll: async (params?: OrdersGetAllParams): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>("/api/v1/shop/all_orders", {
      params,
    });
    return response.data;
  },

  getByShop: async (shopId: number, params?: OrdersGetAllParams): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>(`/api/v1/shop/orders/${shopId}`, {
      params,
    });
    return response.data;
  },

  changeStatus: async (data: ChangeOrderStatusRequest): Promise<void> => {
    await httpClient.put("/api/v1/shop/orders/status", data);
  },
};
