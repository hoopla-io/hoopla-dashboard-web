import { httpClient } from "@/lib/api/http-client";
import type {
  Story,
  StoryWithItems,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreateStoryItemRequest,
  UpdateStoryItemRequest,
} from "@/lib/api/schemas/stories";
import type { PaginatedResponse, ApiResponse } from "@/lib/api/types";

function buildStoryFormData(data: Partial<CreateStoryRequest>, file?: File): FormData {
  const formData = new FormData();
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.sort_order !== undefined) formData.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));
  if (data.start_date) formData.append("start_date", data.start_date);
  if (data.end_date) formData.append("end_date", data.end_date);
  if (file) formData.append("file", file);
  return formData;
}

function buildStoryItemFormData(data: Partial<CreateStoryItemRequest>, file?: File): FormData {
  const formData = new FormData();
  if (data.story_id !== undefined) formData.append("story_id", String(data.story_id));
  if (data.title !== undefined) formData.append("title", data.title);
  if (data.description !== undefined) formData.append("description", data.description);
  if (data.link_type !== undefined) formData.append("link_type", data.link_type);
  if (data.link_value !== undefined) formData.append("link_value", data.link_value);
  if (data.sort_order !== undefined) formData.append("sort_order", String(data.sort_order));
  if (data.duration !== undefined) formData.append("duration", String(data.duration));
  if (file) formData.append("file", file);
  return formData;
}

export const storiesApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Story>> => {
    const response = await httpClient.get<ApiResponse<Story[]>>("/api/v1/story/list", { params });
    return response.data;
  },

  getById: async (id: number): Promise<StoryWithItems> => {
    const response = await httpClient.get<ApiResponse<StoryWithItems>>(`/api/v1/story/show/${id}`);
    return response.data.data ?? response.data;
  },

  create: async (data: CreateStoryRequest, file?: File): Promise<{ id: number }> => {
    const formData = buildStoryFormData(data, file);
    const response = await httpClient.post<ApiResponse<{ id: number }>>("/api/v1/story/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateStoryRequest, file?: File): Promise<void> => {
    const formData = buildStoryFormData(data, file);
    await httpClient.put(`/api/v1/story/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/story/delete/${id}`);
  },
};

export const storyItemsApi = {
  create: async (data: CreateStoryItemRequest, file?: File): Promise<{ id: number }> => {
    const formData = buildStoryItemFormData(data, file);
    const response = await httpClient.post<ApiResponse<{ id: number }>>("/api/v1/story/item/store", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data ?? response.data;
  },

  update: async (id: number, data: UpdateStoryItemRequest, file?: File): Promise<void> => {
    const formData = buildStoryItemFormData(data, file);
    await httpClient.put(`/api/v1/story/item/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/api/v1/story/item/delete/${id}`);
  },
};
