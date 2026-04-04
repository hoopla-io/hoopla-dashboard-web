import { z } from "zod";

export const BannerSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  link_type: z.enum(["partner", "drink", "url"]),
  link_value: z.string().nullable().optional(),
  position: z.enum(["main", "partner"]),
  partner_id: z.number().nullable().optional(),
  sort_order: z.number(),
  is_active: z.boolean(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const CreateBannerSchema = z.object({
  title: z.string().optional(),
  link_type: z.enum(["partner", "drink", "url"]),
  link_value: z.string().optional(),
  position: z.enum(["main", "partner"]),
  partner_id: z.number().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const UpdateBannerSchema = CreateBannerSchema.partial();

export type Banner = z.infer<typeof BannerSchema>;
export type CreateBannerRequest = z.infer<typeof CreateBannerSchema>;
export type UpdateBannerRequest = z.infer<typeof UpdateBannerSchema>;
