import { z } from "zod";

export const PARTNER_USER_ROLES = ["MANAGER", "CASHIER"] as const;

export const PartnerUserSchema = z.object({
  id: z.number(),
  partner_id: z.number().optional().nullable(),
  shop_id: z.number().optional().nullable(),
  name: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
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
  role: z.enum(PARTNER_USER_ROLES).optional(),
  vendor_pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
});

export const UpdatePartnerUserSchema = z.object({
  partner_id: z.number().optional(),
  shop_id: z.number().int().positive().optional(),
  name: z.string().max(100).optional(),
  role: z.enum(PARTNER_USER_ROLES).optional(),
  vendor_pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
});

export type PartnerUserRole = (typeof PARTNER_USER_ROLES)[number];
export type PartnerUser = z.infer<typeof PartnerUserSchema>;
export type CreatePartnerUserRequest = z.infer<typeof CreatePartnerUserSchema>;
export type UpdatePartnerUserRequest = z.infer<typeof UpdatePartnerUserSchema>;
