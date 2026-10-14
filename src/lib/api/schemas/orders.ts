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
  promo_code: z.string().optional().nullable(),
  shop: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  settlement_paid: z.boolean().optional(),
  time: z.string().optional(),
  last_update: z.string().optional(),
  fiscal_link: z.string().optional(),
  feedback: OrderFeedbackSchema.optional().nullable(),
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

export const OrdersSummarySchema = z.object({
  revenue_completed: z.number(),
  completed_count: z.number(),
  cancelled_count: z.number(),
  cancelled_sum: z.number(),
  active_count: z.number(),
});

export type OrderFeedback = z.infer<typeof OrderFeedbackSchema>;
export type OrdersSummary = z.infer<typeof OrdersSummarySchema>;

export const OrderFilterSchema = z.object({
  id: z.number().optional(),
  status: z.string().optional(),
  drink: z.string().optional(),
  time: z.string().optional(),
});

export const ChangeOrderStatusSchema = z.object({
  id: z.number(),
  status: z.string(),
  reason: z.string().optional(),
});

export const OrderDetailSchema = z.object({
  id: z.number(),
  status: z.string(),
  source: z.string(),
  vendor: z.string().nullable(),
  vendor_order_id: z.string().nullable(),
  payment_provider: z.string().nullable(),
  payment_method: z.string().nullable(),
  is_paid: z.boolean(),
  promo_code: z.string().nullable(),
  comment: z.string().nullable(),
  fiscal_link: z.string().nullable(),
  created_at: z.string(),
  placed_at: z.string(),
  completed_at: z.string().nullable(),
  pickup_time: z.string().nullable(),
  partner: z.object({ id: z.number(), name: z.string() }),
  shop: z.object({ id: z.number(), name: z.string() }),
  table: z.string().nullable(),
  user: z.object({ id: z.number(), name: z.string(), phone_number: z.string() }),
  settlement_status: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
      modifiers: z.array(z.object({ name: z.string(), price: z.number(), quantity: z.number() })),
    })
  ),
  money: z.object({
    subtotal: z.number(),
    promo_discount: z.number(),
    wallet: z.number(),
    card: z.number(),
    gift_card: z.number(),
    customer_paid: z.number(),
    cashback_earned: z.number(),
    card_status: z.string().nullable(),
    card_system: z.string().nullable(),
    card_pan: z.string().nullable(),
  }),
  timeline: z.array(
    z.object({
      id: z.number(),
      type: z.string(),
      at: z.string(),
      staff_name: z.string().nullable(),
      details: z.record(z.string(), z.unknown()).nullable(),
    })
  ),
  feedbacks: z.array(
    z.object({
      id: z.number(),
      order_item_id: z.number().nullable(),
      rating: z.number(),
      comment: z.string().nullable(),
      created_at: z.string(),
    })
  ),
});

export type OrderDetail = z.infer<typeof OrderDetailSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
export type ChangeOrderStatusRequest = z.infer<typeof ChangeOrderStatusSchema>;
