import { httpClient } from "@/lib/api/http-client";
import type { Order, OrderFilter, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";



import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const ordersApi = {
  getAll: async (filter?: OrderFilter): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>("/api/v1/shop/all_orders", {
      params: filter,
    });
    return response.data;
  },

  getByShop: async (shopId: number, filter?: OrderFilter): Promise<PaginatedResponse<Order>> => {
    const response = await httpClient.get<ApiResponse<Order[]>>(`/api/v1/shop/orders/${shopId}`, {
      params: filter,
    });
    return response.data;
  },

  changeStatus: async (data: ChangeOrderStatusRequest): Promise<void> => {
    await httpClient.put("/api/v1/shop/orders/status", data);
  },
};
