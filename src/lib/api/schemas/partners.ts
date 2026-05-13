import { z } from "zod";

export const PartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  vendor_id: z.string().optional().nullable(),
  vendor_key: z.string().optional().nullable(),
  tin_type: z.string().optional().nullable(),
  tin_num: z.string().optional().nullable(),
  tin_percent: z.number().optional().nullable(),
  cashback_percent: z.number().optional().nullable(),
  created_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  status: z.boolean().optional(),
  rating: z.number().optional().nullable(),
});

export const CreatePartnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  vendor: z.enum(["iiko", "poster", "deliveryhub", "loyverse", "hoopla"]).optional(),
  vendor_id: z.string().optional(),
  vendor_key: z.string().optional(),
  tin_type: z.enum(["tin", "pinfl"]).optional(),
  tin_num: z.string().optional(),
  tin_percent: z.number().optional(),
  cashback_percent: z.number().optional(),
  status: z.boolean().optional(),
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

export const PartnerFeedbackSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  rating: z.number(),
  comment: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
});

export type PartnerFeedback = z.infer<typeof PartnerFeedbackSchema>;
