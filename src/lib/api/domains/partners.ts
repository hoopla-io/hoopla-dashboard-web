import { httpClient } from "@/lib/api/http-client";
import type { Partner, CreatePartnerRequest, PartnerAttribute, CreatePartnerAttributeRequest } from "@/lib/api/schemas/partners";




import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

export const partnersApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Partner>> => {
    const response = await httpClient.get<ApiResponse<Partner[]>>("/api/v1/partner/list", {
      params,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Partner> => {
    const response = await httpClient.get<ApiResponse<Partner>>(`/api/v1/partner/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreatePartnerRequest, file?: File): Promise<Partner> => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.vendor) formData.append("vendor", data.vendor);
    if (data.vendor_id) formData.append("vendor_id", data.vendor_id);
    if (data.vendor_key) formData.append("vendor_key", data.vendor_key);
    if (data.tin_type) formData.append("tin_type", data.tin_type);
    if (data.tin_num) formData.append("tin_num", data.tin_num);
    if (data.tin_percent) formData.append("tin_percent", String(data.tin_percent));
    if (file) formData.append("file", file);

    const response = await httpClient.post<ApiResponse<Partner>>("/api/v1/partner/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: Partial<CreatePartnerRequest>, file?: File): Promise<Partner> => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.vendor) formData.append("vendor", data.vendor);
    if (data.vendor_id) formData.append("vendor_id", data.vendor_id);
    if (data.vendor_key) formData.append("vendor_key", data.vendor_key);
    if (data.tin_type) formData.append("tin_type", data.tin_type);
    if (data.tin_num) formData.append("tin_num", data.tin_num);
    if (data.tin_percent) formData.append("tin_percent", String(data.tin_percent));
    if (file) formData.append("file", file);

    const response = await httpClient.put<ApiResponse<Partner>>(`/api/v1/partner/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/delete/${id}`);
  },

  getAttributes: async (partnerId: number): Promise<PartnerAttribute[]> => {
    const response = await httpClient.get<ApiResponse<PartnerAttribute[]>>("/api/v1/partner/attributes/list", {
      params: { partner_id: partnerId },
    });
    return response.data.data || [];
  },

  createAttribute: async (data: CreatePartnerAttributeRequest): Promise<PartnerAttribute> => {
    const formData = new FormData();
    formData.append("partner_id", String(data.partner_id));
    formData.append("attribute_key", data.attribute_key);
    formData.append("attribute_value", data.attribute_value);

    const response = await httpClient.post<ApiResponse<PartnerAttribute>>("/api/v1/partner/attributes/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  deleteAttribute: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/partner/attributes/delete/${id}`);
  },
};
