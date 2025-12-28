import { z } from "zod";

export const PartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

export const CreatePartnerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
});

export const UpdatePartnerSchema = CreatePartnerSchema.partial();

export type Partner = z.infer<typeof PartnerSchema>;
export type CreatePartnerRequest = z.infer<typeof CreatePartnerSchema>;
export type UpdatePartnerRequest = z.infer<typeof UpdatePartnerSchema>;

// Partner Attributes
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
