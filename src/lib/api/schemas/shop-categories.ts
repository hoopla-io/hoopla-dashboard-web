import { z } from "zod";

export const ShopCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  image_url: z.string().nullable().optional(),
  sort_order: z.number(),
  is_active: z.boolean(),
});

export const ShopCategoryWithPartnersSchema = ShopCategorySchema.extend({
  partners: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateShopCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const UpdateShopCategorySchema = CreateShopCategorySchema.partial();

export type ShopCategory = z.infer<typeof ShopCategorySchema>;
export type ShopCategoryWithPartners = z.infer<typeof ShopCategoryWithPartnersSchema>;
export type CreateShopCategoryRequest = z.infer<typeof CreateShopCategorySchema>;
export type UpdateShopCategoryRequest = z.infer<typeof UpdateShopCategorySchema>;
export type LinkPartnerRequest = { partner_id: number; category_id: number };
