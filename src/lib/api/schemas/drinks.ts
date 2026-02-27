import { z } from "zod";

export const DrinkSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().optional(),
  partner: z.string().optional(),
  image_url: z.string().optional(),
});

export const CreateDrinkSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const UpdateDrinkSchema = CreateDrinkSchema.partial();

export type Drink = z.infer<typeof DrinkSchema>;
export type CreateDrinkRequest = z.infer<typeof CreateDrinkSchema>;
export type UpdateDrinkRequest = z.infer<typeof UpdateDrinkSchema>;

export const PartnerDrinkSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  name: z.string().optional(),
  drink_id: z.number().optional(),
  drink: DrinkSchema.optional(),
  vendor_product_id: z.string().optional(),
  product_price: z.number().optional(),
  vendor_product_price: z.number().optional(),
  vendor_product_name: z.string().optional(),
  imageUrl: z.string().optional(),
  image_url: z.string().nullable().optional(),
});

export const CreatePartnerDrinkSchema = z.object({
  partner_id: z.number(),
  drink_id: z.number(),
  vendor_product_id: z.string().optional(),
  product_price: z.number().optional(),
  vendor_product_price: z.number().optional(),
  vendor_product_name: z.string().optional(),
});

export const UpdatePartnerDrinkSchema = CreatePartnerDrinkSchema.partial().omit({ partner_id: true, drink_id: true });

export type PartnerDrink = z.infer<typeof PartnerDrinkSchema>;
export type CreatePartnerDrinkRequest = z.infer<typeof CreatePartnerDrinkSchema>;
export type UpdatePartnerDrinkRequest = z.infer<typeof UpdatePartnerDrinkSchema>;

export const PartnerDrinkModifierSchema = z.object({
  id: z.number(),
  vendor_addon_id: z.string(),
  vendor_addon_key: z.string().optional().nullable(),
  vendor_addon_name: z.string(),
  vendor_addon_price: z.number(),
  vendor_group_id: z.string().optional().nullable(),
  partner_id: z.number().optional().nullable(),
  drink_id: z.number().optional().nullable(),
});

export const CreatePartnerDrinkModifierSchema = z.object({
  drink_id: z.number(),
  partner_id: z.number(),
  vendor_addon_id: z.string(),
  vendor_addon_key: z.string().optional(),
  vendor_addon_name: z.string(),
  vendor_addon_price: z.number(),
  vendor_group_id: z.string().optional(),
});

export const UpdatePartnerDrinkModifierSchema = CreatePartnerDrinkModifierSchema.omit({ drink_id: true, partner_id: true });

export type PartnerDrinkModifier = z.infer<typeof PartnerDrinkModifierSchema>;
export type CreatePartnerDrinkModifierRequest = z.infer<typeof CreatePartnerDrinkModifierSchema>;
export type UpdatePartnerDrinkModifierRequest = z.infer<typeof UpdatePartnerDrinkModifierSchema>;
