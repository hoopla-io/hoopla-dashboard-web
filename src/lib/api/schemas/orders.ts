import { z } from "zod";

export const OrderFeedbackSchema = z.object({
  id: z.number(),
  rating: z.number(),
  comment: z.string().optional().nullable(),
});

export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  source: z.string().optional(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    phone_number: z.string().optional(),
  }).optional(),
  drink: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  price: z.number().optional(),
  shop: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  settlement_paid: z.boolean().optional(),
  time: z.string().optional(),
  last_update: z.string().optional(),
  fiscal_link: z.string().optional(),
  feedback: OrderFeedbackSchema.optional().nullable(),
  // Distinct drink lines for a cart-checkout order — length 1 for today's
  // ordinary single-drink orders, absent/empty otherwise.
  items: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    )
    .optional(),
});

export type OrderFeedback = z.infer<typeof OrderFeedbackSchema>;

export const OrderFilterSchema = z.object({
  id: z.number().optional(),
  status: z.string().optional(),
  drink: z.string().optional(),
  time: z.string().optional(),
});

export const ChangeOrderStatusSchema = z.object({
  id: z.number(),
  status: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
export type ChangeOrderStatusRequest = z.infer<typeof ChangeOrderStatusSchema>;
