import { z } from "zod";

export const ShopEventSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  event_type: z.string(),
  shop: z.object({
    id: z.number(),
    name: z.string(),
  }),
  user: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
  order_id: z.number().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

export type ShopEvent = z.infer<typeof ShopEventSchema>;
