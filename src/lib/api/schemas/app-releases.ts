import { z } from "zod";

export const AppReleasePlatformSchema = z.enum(["android", "windows"]);

export const AppReleaseSchema = z.object({
  id: z.number(),
  platform: AppReleasePlatformSchema,
  version: z.string(),
  force_update: z.boolean(),
  file_size: z.number().nullable().optional(),
  original_name: z.string().nullable().optional(),
  download_url: z.string(),
  created_at: z.string(),
});

export type AppReleasePlatform = z.infer<typeof AppReleasePlatformSchema>;
export type AppRelease = z.infer<typeof AppReleaseSchema>;
