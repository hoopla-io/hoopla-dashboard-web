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
  vendor_login: z.string().optional().nullable(),
  vendor_organization_id: z.string().optional().nullable(),
  can_accept_orders: z.boolean().optional(),
  phoneNumbers: z.any().optional().nullable(),
  workingHours: z.array(z.object({
      weekDay: z.string(),
      openAt: z.string(),
      closeAt: z.string(),
  })).optional().nullable(),
  urls: z.any().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  status: z.boolean().optional(),
  // Franchise-override fields: a shop can bill under its own legal entity
  // instead of inheriting the partner's TIN, and can override the partner's
  // default hours with "always open" or a POS restock window.
  use_own_legal: z.boolean().optional().nullable(),
  tin_type: z.string().optional().nullable(),
  tin_num: z.string().optional().nullable(),
  tin_percent: z.number().optional().nullable(),
  always_open: z.boolean().optional().nullable(),
  restock_time: z.string().optional().nullable(),
});

export const CreateShopSchema = z.object({
  partner_id: z.number(),
  name: z.string().min(1, "Name is required"),
  location_lat: z.number(),
  location_long: z.number(),
  vendor_terminal_id: z.string().optional(),
  vendor_login: z.string().max(255).optional(),
  vendor_password: z.string().min(4).max(255).optional(),
  vendor_organization_id: z.string().max(255).optional(),
  status: z.boolean().optional(),
  use_own_legal: z.boolean().optional(),
  tin_type: z.enum(["tin", "pinfl"]).optional(),
  tin_num: z.string().optional(),
  tin_percent: z.number().min(0).max(100).optional(),
  always_open: z.boolean().optional(),
  // "HH:MM"; sent as "" on edit to clear.
  restock_time: z.string().optional(),
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
  image_id: z.number(),
  image_url: z.string().optional(),
});

export type ShopPicture = z.infer<typeof ShopPictureSchema>;

// A partner's drink as it appears in a specific shop's menu — lets an admin
// disable a drink at just this shop without touching the partner-wide drink.
export const ShopDrinkSchema = z.object({
  partner_drink_id: z.number(),
  name: z.string(),
  picture_url: z.string().optional().nullable(),
  product_price: z.number().optional().nullable(),
  disabled: z.boolean(),
  // POS-controlled, read-only from this admin surface.
  out_of_stock: z.boolean(),
  out_of_stock_until: z.string().optional().nullable(),
});

export type ShopDrink = z.infer<typeof ShopDrinkSchema>;
