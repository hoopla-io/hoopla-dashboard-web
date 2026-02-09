import { z } from "zod";

export const ShopSchema = z.object({
  id: z.number(),
  partnerId: z.number().optional(),
  partner_id: z.number().optional(),
  partner: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  name: z.string(),
  location_lat: z.number().optional(),
  location_long: z.number().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  image_url: z.string().optional().nullable(),
  pictures: z.array(z.object({
    image_url: z.string(),
  })).optional(),
  vendor_terminal_id: z.string().optional(),
  can_accept_orders: z.boolean().optional(),
  phoneNumbers: z.any().optional().nullable(),
  workingHours: z.array(z.object({
      weekDay: z.string(),
      openAt: z.string(),
      closeAt: z.string(),
  })).optional().nullable(),
  urls: z.any().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const CreateShopSchema = z.object({
  partner_id: z.number(),
  name: z.string().min(1, "Name is required"),
  location_lat: z.number(),
  location_long: z.number(),
  vendor_terminal_id: z.string().optional(),
});

export const UpdateShopSchema = CreateShopSchema.partial();

export type Shop = z.infer<typeof ShopSchema>;
export type CreateShopRequest = z.infer<typeof CreateShopSchema>;
export type UpdateShopRequest = z.infer<typeof UpdateShopSchema>;

export const ShopAttributeSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  attribute_key: z.string(),
  attribute_value: z.string(),
});

export type ShopAttribute = z.infer<typeof ShopAttributeSchema>;

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

export const ShopPictureSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  url: z.string().optional(),
});

export type ShopPicture = z.infer<typeof ShopPictureSchema>;
