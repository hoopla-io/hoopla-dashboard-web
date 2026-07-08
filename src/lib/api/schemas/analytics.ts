import { z } from "zod";

export const LabeledCountSchema = z.object({
  label: z.string(),
  users: z.number(),
});

export const NamedMetricSchema = z.object({
  name: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

export const DailyPointSchema = z.object({
  day: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

export const HourlyPointSchema = z.object({
  hour: z.number(),
  orders: z.number(),
  revenue: z.number(),
});

export const LoyaltySchema = z.object({
  new_users: z.number(),
  returning_users: z.number(),
  repeat_users: z.number(),
  orders_per_user: z.number(),
});

export const FulfillmentSchema = z.object({
  avg_minutes: z.number().nullable(),
  median_minutes: z.number().nullable(),
  measured_orders: z.number(),
  total_orders: z.number(),
});

export const PartnerAnalyticsSchema = z.object({
  unique_users: z.number(),
  gender: z.array(LabeledCountSchema),
  age: z.array(LabeledCountSchema),
  top_drinks: z.array(NamedMetricSchema),
  top_categories: z.array(NamedMetricSchema),
  daily: z.array(DailyPointSchema),
  hourly: z.array(HourlyPointSchema),
  loyalty: LoyaltySchema,
  operators: z.array(LabeledCountSchema),
  fulfillment: FulfillmentSchema,
  from: z.string(),
  to: z.string(),
});

export type LabeledCount = z.infer<typeof LabeledCountSchema>;
export type NamedMetric = z.infer<typeof NamedMetricSchema>;
export type DailyPoint = z.infer<typeof DailyPointSchema>;
export type HourlyPoint = z.infer<typeof HourlyPointSchema>;
export type Loyalty = z.infer<typeof LoyaltySchema>;
export type Fulfillment = z.infer<typeof FulfillmentSchema>;
export type PartnerAnalytics = z.infer<typeof PartnerAnalyticsSchema>;
