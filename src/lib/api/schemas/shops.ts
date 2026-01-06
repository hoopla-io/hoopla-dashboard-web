import { z } from "zod";

export const ShopSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  partner_name: z.string().optional(),
  name: z.string(),
  location_lat: z.number().optional(),
  location_long: z.number().optional(),
  image_url: z.string().optional(),
  deleted_at: z.string().optional().nullable(),
});

export const CreateShopSchema = z.object({
  partner_id: z.number(),
  name: z.string().min(1, "Name is required"),
  location_lat: z.number(),
  location_long: z.number(),
});

export const UpdateShopSchema = CreateShopSchema.partial();

export type Shop = z.infer<typeof ShopSchema>;
export type CreateShopRequest = z.infer<typeof CreateShopSchema>;
export type UpdateShopRequest = z.infer<typeof UpdateShopSchema>;

// Shop Attributes
export const ShopAttributeSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  attribute_key: z.string(),
  attribute_value: z.string(),
});

export type ShopAttribute = z.infer<typeof ShopAttributeSchema>;

// Shop Hours
export const ShopHoursSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  week_day: z.string(),
  open_at: z.string(),
  close_at: z.string(),
});

export const CreateShopHoursSchema = z.object({
  shop_id: z.number(),
  week_day: z.string().min(1, "Week day is required"),
  open_at: z.string().min(1, "Opening time is required"),
  close_at: z.string().min(1, "Closing time is required"),
});

export type ShopHours = z.infer<typeof ShopHoursSchema>;
export type CreateShopHoursRequest = z.infer<typeof CreateShopHoursSchema>;

// Shop Pictures
export const ShopPictureSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  url: z.string().optional(),
});

export type ShopPicture = z.infer<typeof ShopPictureSchema>;
