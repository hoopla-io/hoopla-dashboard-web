import { z } from "zod";

export const PartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  vendor_key: z.string().optional().nullable(),
  tin_type: z.string().optional().nullable(),
  tin_num: z.string().optional().nullable(),
  tin_percent: z.number().optional().nullable(),
  cashback_percent: z.number().optional().nullable(),
  commission_percent: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  status: z.boolean().optional(),
  rating: z.number().optional().nullable(),
  type: z.enum(["normal", "test"]).optional(),
  // Default weekly hours new shops inherit unless they override with their own
  // hours/always_open. Kept in sync with the dedicated partner/hours CRUD below.
  workingHours: z.array(z.object({
    weekDay: z.string(),
    open_at: z.string(),
    close_at: z.string(),
  })).optional().nullable(),
});

export const CreatePartnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  vendor: z.enum(["iiko", "poster", "deliveryhub", "loyverse", "hoopla"]).optional(),
  vendor_key: z.string().optional(),
  tin_type: z.enum(["tin", "pinfl"]).optional(),
  tin_num: z.string().optional(),
  tin_percent: z.number().optional(),
  cashback_percent: z.number().optional(),
  commission_percent: z.number().optional(),
  status: z.boolean().optional(),
  // "test" partners (and their shops) are hidden from real customer traffic
  // unless the request carries the X-Hoopla-Test header — lets QA run a full
  // real order flow without polluting what real customers see.
  type: z.enum(["normal", "test"]).optional(),
});

export const UpdatePartnerSchema = CreatePartnerSchema.partial();

export type Partner = z.infer<typeof PartnerSchema>;
export type CreatePartnerRequest = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerRequest = z.infer<typeof UpdatePartnerSchema>;

export const PartnerAttributeSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  attribute_key: z.string(),
  attribute_value: z.string(),
});

export const CreatePartnerAttributeSchema = z.object({
  partner_id: z.number(),
  attribute_key: z.string().min(1, "Key is required"),
  attribute_value: z.string().min(1, "Value is required"),
});

export type PartnerAttribute = z.infer<typeof PartnerAttributeSchema>;
export type CreatePartnerAttributeRequest = z.infer<typeof CreatePartnerAttributeSchema>;

// Partner default hours — same shape as shop hours (src/lib/api/schemas/shops.ts),
// used as the fallback schedule for shops that don't set their own hours/always_open.
export const PartnerHoursSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  week_day: z.string(),
  open_at: z.string(),
  close_at: z.string(),
});

export const CreatePartnerHoursSchema = z.object({
  partner_id: z.number(),
  week_day: z.string().min(1, "Week day is required"),
  open_at: z.string().min(1, "Opening time is required"),
  close_at: z.string().min(1, "Closing time is required"),
});

export type PartnerHours = z.infer<typeof PartnerHoursSchema>;
export type CreatePartnerHoursRequest = z.infer<typeof CreatePartnerHoursSchema>;

export const PartnerFeedbackSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  rating: z.number(),
  comment: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

export type PartnerFeedback = z.infer<typeof PartnerFeedbackSchema>;
