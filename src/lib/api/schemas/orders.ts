import { z } from "zod";

export const OrderFeedbackSchema = z.object({
  id: z.number(),
  rating: z.number(),
  comment: z.string().optional().nullable(),
});

export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
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
  time: z.string().optional(),
  last_update: z.string().optional(),
  fiscal_link: z.string().optional(),
  feedback: OrderFeedbackSchema.optional().nullable(),
  // Every line of the order's composition — drinks and their modifiers.
  // Length 1 for today's ordinary single-drink orders. A "modifier" row's
  // parent_item_id is the id of the "drink" row it belongs to; group by it
  // instead of assuming array order.
  items: z
    .array(
      z.object({
        id: z.number(),
        type: z.enum(["drink", "modifier"]),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        parent_item_id: z.number().nullable(),
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
