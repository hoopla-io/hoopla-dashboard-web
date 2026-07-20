import type { AxiosProgressEvent } from "axios";

import { httpClient } from "@/lib/api/http-client";
import type { AppRelease, AppReleasePlatform } from "@/lib/api/schemas/app-releases";
import type { ApiResponse } from "@/lib/api/types";

type CreateAppReleaseInput = {
  platform: AppReleasePlatform;
  version: string;
  forceUpdate: boolean;
  file: File;
};

export const appReleasesApi = {
  list: async (platform?: AppReleasePlatform): Promise<AppRelease[]> => {
    const response = await httpClient.get<ApiResponse<AppRelease[]>>("/api/v1/app-release/list", {
      params: platform ? { platform } : undefined,
    });
    return response.data.data ?? [];
  },

  create: async (
    data: CreateAppReleaseInput,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<AppRelease> => {
    const formData = new FormData();
    formData.append("platform", data.platform);
    formData.append("version", data.version);
    formData.append("force_update", String(data.forceUpdate));
    formData.append("file", data.file);

    const response = await httpClient.post<ApiResponse<AppRelease>>(
      "/api/v1/app-release/store",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      }
    );
    return response.data.data ?? response.data;
  },

  remove: async (id: number): Promise<void> => {
    await httpClient.post(`/api/v1/app-release/delete/${id}`);
  },
};
