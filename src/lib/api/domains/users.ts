import { httpClient } from "@/lib/api/http-client";
import type {
  User,
  UserDetail,
  UserTransaction,
  UserTransactionTotals,
  UserSession,
  UserFeedback,
  UserPromocodeRedemption,
  EditUserRequest,
  FilterUserRequest,
} from "@/lib/api/schemas/users";



import type { PaginatedResponse, ApiResponse, Meta, PaginationParams, SortParams } from "@/lib/api/types";

export interface UsersGetAllParams extends PaginationParams, SortParams {
  id?: number;
  name?: string;
  phone_number?: string;
  mobile_provider?: string;
  gender?: string;
}

export interface UserTransactionsParams extends PaginationParams, SortParams {
  transaction_type?: string;
  payment_type?: string;
}

export interface UserTransactionsResponse {
  data: {
    transactions: UserTransaction[];
    totals: UserTransactionTotals;
  };
  meta?: Meta | null;
}

export type UserListParams = PaginationParams & SortParams;

export const usersApi = {
  getAll: async (params?: UsersGetAllParams): Promise<PaginatedResponse<User>> => {
    const response = await httpClient.get<ApiResponse<User[]>>("/api/v1/users/list", {
      params,
    });
    return response.data;
  },

  getById: async (id: number): Promise<UserDetail> => {
    const response = await httpClient.get<ApiResponse<UserDetail>>(`/api/v1/users/show/${id}`);
    return response.data.data;
  },

  getTransactions: async (id: number, params?: UserTransactionsParams): Promise<UserTransactionsResponse> => {
    const response = await httpClient.get<UserTransactionsResponse>(`/api/v1/users/transactions/${id}`, {
      params,
    });
    return response.data;
  },

  getSessions: async (id: number, params?: UserListParams): Promise<PaginatedResponse<UserSession>> => {
    const response = await httpClient.get<ApiResponse<UserSession[]>>(`/api/v1/users/sessions/${id}`, {
      params,
    });
    return response.data;
  },

  getFeedbacks: async (id: number, params?: UserListParams): Promise<PaginatedResponse<UserFeedback>> => {
    const response = await httpClient.get<ApiResponse<UserFeedback[]>>(`/api/v1/users/feedbacks/${id}`, {
      params,
    });
    return response.data;
  },

  getPromocodes: async (id: number, params?: PaginationParams): Promise<PaginatedResponse<UserPromocodeRedemption>> => {
    const response = await httpClient.get<ApiResponse<UserPromocodeRedemption[]>>(`/api/v1/users/promocodes/${id}`, {
      params,
    });
    return response.data;
  },

  update: async (id: number, data: EditUserRequest): Promise<User> => {
    const response = await httpClient.put<ApiResponse<User>>(`/api/v1/users/edit/${id}`, data);
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/users/delete/${id}`);
  },

  filter: async (filter: FilterUserRequest): Promise<User[]> => {
    const response = await httpClient.post<ApiResponse<User[]>>("/api/v1/users/filter", filter);
    return response.data.data ?? response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await httpClient.get<ApiResponse<User>>("/api/v1/users/get-me");
    return response.data.data ?? response.data;
  },
};
