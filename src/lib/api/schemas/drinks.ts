import { z } from "zod";

export const DrinkSchema = z.object({
  id: z.number(),
  name: z.string(),
  image_url: z.string().optional(),
});

export const CreateDrinkSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const UpdateDrinkSchema = CreateDrinkSchema.partial();

export type Drink = z.infer<typeof DrinkSchema>;
export type CreateDrinkRequest = z.infer<typeof CreateDrinkSchema>;
export type UpdateDrinkRequest = z.infer<typeof UpdateDrinkSchema>;

// Partner Drinks
export const PartnerDrinkSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  drink_id: z.number(),
  drink: DrinkSchema.optional(),
});

export type PartnerDrink = z.infer<typeof PartnerDrinkSchema>;
