import { httpClient } from "@/lib/api/http-client";
import type {
  PartnerUser,
  CreatePartnerUserRequest,
  UpdatePartnerUserRequest,
} from "@/lib/api/schemas/partner-users";
import type { PaginatedResponse, ApiResponse, PaginationParams } from "@/lib/api/types";

export type PartnerUsersGetAllParams = PaginationParams & { partner_id?: number };

export const partnerUsersApi = {
  getAll: async (params?: PartnerUsersGetAllParams): Promise<PaginatedResponse<PartnerUser>> => {
    const response = await httpClient.get<ApiResponse<PartnerUser[]>>("/api/v1/partner/user/list", {
      params,
    });
    return response.data;
  },

  getById: async (id: number): Promise<PartnerUser> => {
    const response = await httpClient.get<ApiResponse<PartnerUser>>(`/api/v1/partner/user/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreatePartnerUserRequest): Promise<PartnerUser> => {
    const response = await httpClient.post<ApiResponse<PartnerUser>>(
      "/api/v1/partner/user/store",
      data
    );
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdatePartnerUserRequest): Promise<PartnerUser> => {
    const response = await httpClient.put<ApiResponse<PartnerUser>>(
      `/api/v1/partner/user/edit/${id}`,
      data
    );
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/user/delete/${id}`);
  },
};
