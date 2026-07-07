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

export const PartnerAnalyticsSchema = z.object({
  unique_users: z.number(),
  gender: z.array(LabeledCountSchema),
  age: z.array(LabeledCountSchema),
  top_drinks: z.array(NamedMetricSchema),
  top_categories: z.array(NamedMetricSchema),
  daily: z.array(DailyPointSchema),
  from: z.string(),
  to: z.string(),
});

export type LabeledCount = z.infer<typeof LabeledCountSchema>;
export type NamedMetric = z.infer<typeof NamedMetricSchema>;
export type DailyPoint = z.infer<typeof DailyPointSchema>;
export type PartnerAnalytics = z.infer<typeof PartnerAnalyticsSchema>;
