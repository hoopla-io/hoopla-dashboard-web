import { z } from "zod";

export const PromocodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  description: z.string().nullable().optional(),
  discount_type: z.enum(["amount", "percent"]),
  discount_value: z.number(),
  max_discount_percent: z.number().nullable().optional(),
  max_discount_amount: z.number().nullable().optional(),
  min_order_amount: z.number(),
  usage_limit: z.number().nullable().optional(),
  per_user_limit: z.number(),
  used_count: z.number(),
  partner_id: z.number().nullable().optional(),
  user_id: z.number().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const CreatePromocodeSchema = z.object({
  code: z.string(),
  description: z.string().optional(),
  discount_type: z.enum(["amount", "percent"]),
  discount_value: z.number(),
  max_discount_percent: z.number().optional(),
  max_discount_amount: z.number().optional(),
  min_order_amount: z.number().optional(),
  usage_limit: z.number().optional(),
  per_user_limit: z.number().optional(),
  partner_id: z.number().optional(),
  user_id: z.number().optional(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const UpdatePromocodeSchema = CreatePromocodeSchema.partial();

export type Promocode = z.infer<typeof PromocodeSchema>;
export type CreatePromocodeRequest = z.infer<typeof CreatePromocodeSchema>;
export type UpdatePromocodeRequest = z.infer<typeof UpdatePromocodeSchema>;
