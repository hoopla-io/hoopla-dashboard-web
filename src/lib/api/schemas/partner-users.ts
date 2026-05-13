import { z } from "zod";

export const PARTNER_USER_ROLES = ["MANAGER", "CASHIER"] as const;

export const PartnerUserSchema = z.object({
  id: z.number(),
  partner_id: z.number().optional().nullable(),
  shop_id: z.number().optional().nullable(),
  name: z.string().optional().nullable(),
  phone_number: z.string(),
  mobile_provider: z.string().optional().nullable(),
  role: z.string(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  partner: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  shop: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional()
    .nullable(),
});

export const CreatePartnerUserSchema = z.object({
  partner_id: z.number(),
  shop_id: z.number().int().positive("Shop is required so the cashier can log in"),
  name: z.string().max(100).optional(),
  phone_number: z
    .string()
    .min(9, "Phone number is required")
    .max(20),
  password: z.string().min(1).optional(),
  role: z.enum(PARTNER_USER_ROLES).optional(),
  mobile_provider: z.string().optional(),
});

export const UpdatePartnerUserSchema = z.object({
  partner_id: z.number().optional(),
  shop_id: z.number().int().positive().optional(),
  name: z.string().max(100).optional(),
  phone_number: z.string().min(9).max(20).optional(),
  password: z.string().min(1).optional(),
  role: z.enum(PARTNER_USER_ROLES).optional(),
  mobile_provider: z.string().optional(),
});

export type PartnerUserRole = (typeof PARTNER_USER_ROLES)[number];
export type PartnerUser = z.infer<typeof PartnerUserSchema>;
export type CreatePartnerUserRequest = z.infer<typeof CreatePartnerUserSchema>;
export type UpdatePartnerUserRequest = z.infer<typeof UpdatePartnerUserSchema>;
