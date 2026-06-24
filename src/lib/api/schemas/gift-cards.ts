import { z } from "zod";

export const GiftCardTransactionSchema = z.object({
  id: z.number(),
  order_id: z.number().nullable().optional(),
  type: z.enum(["load", "redeem", "refund"]),
  amount: z.number(),
  balance_after: z.number(),
  created_at: z.string(),
});

export const GiftCardSchema = z.object({
  id: z.number(),
  code: z.string(),
  initial_balance: z.number(),
  balance: z.number(),
  currency: z.string(),
  user_id: z.number().nullable().optional(),
  is_active: z.boolean(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const GiftCardDetailSchema = GiftCardSchema.extend({
  transactions: z.array(GiftCardTransactionSchema).nullable().optional(),
});

export const CreateGiftCardSchema = z.object({
  code: z.string(),
  initial_balance: z.number(),
  currency: z.string().optional(),
  user_id: z.number().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type GiftCard = z.infer<typeof GiftCardSchema>;
export type GiftCardDetail = z.infer<typeof GiftCardDetailSchema>;
export type GiftCardTransaction = z.infer<typeof GiftCardTransactionSchema>;
export type CreateGiftCardRequest = z.infer<typeof CreateGiftCardSchema>;
