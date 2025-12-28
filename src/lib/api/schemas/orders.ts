import { z } from "zod";

export const OrderSchema = z.object({
  id: z.number(),
  shop_id: z.number(),
  drink_name: z.string().optional(),
  status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const OrderFilterSchema = z.object({
  id: z.number().optional(),
  status: z.string().optional(),
  drink: z.string().optional(),
  time: z.string().optional(), // YYYY-MM-DD
});

export const ChangeOrderStatusSchema = z.object({
  id: z.number(),
  status: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
export type ChangeOrderStatusRequest = z.infer<typeof ChangeOrderStatusSchema>;
