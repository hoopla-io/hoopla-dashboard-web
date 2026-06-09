import { z } from "zod";

// Cassa (shop) staff roles — used by the SHOP-detail Staff tab (vendor_pin login).
export const PARTNER_USER_ROLES = ["MANAGER", "CASHIER"] as const;

// Merchant-portal roles — used by the PARTNER-detail Staff tab (phone+password
// login to merchant.hoopla.uz). MANAGER is shared (a manager can have both a
// portal password and a cassa PIN); CASHIER is cassa-only.
export const PORTAL_ROLES = ["OWNER", "ACCOUNTANT", "MANAGER"] as const;

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

// Broad request shape covering BOTH tabs. The cassa shop tab sends
// {partner_id, shop_id, name, role, vendor_pin}; the portal partner tab sends
// {partner_id|shop_id, name, phone_number, password, role}. The backend only
// updates the fields that are present, so each tab leaves the other's
// credentials untouched.
export const CreatePartnerUserSchema = z.object({
  partner_id: z.number().optional(),
  shop_id: z.number().int().positive().optional(),
  name: z.string().max(100).optional(),
  phone_number: z.string().max(255).optional(),
  password: z.string().max(255).optional(),
  role: z.string().optional(),
  vendor_pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
});

export const UpdatePartnerUserSchema = CreatePartnerUserSchema;

export type PartnerUserRole = (typeof PARTNER_USER_ROLES)[number];
export type PortalUserRole = (typeof PORTAL_ROLES)[number];
export type PartnerUser = z.infer<typeof PartnerUserSchema>;
export type CreatePartnerUserRequest = z.infer<typeof CreatePartnerUserSchema>;
export type UpdatePartnerUserRequest = z.infer<typeof UpdatePartnerUserSchema>;
