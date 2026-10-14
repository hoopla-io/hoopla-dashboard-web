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

export const StatusCountSchema = z.object({
  status: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

export const OrdersKpiSchema = z.object({
  statuses: z.array(StatusCountSchema),
  unique_customers: z.number(),
  returning_customers: z.number(),
  promo_orders: z.number(),
  cashback_used: z.number(),
  cashback_earned: z.number(),
  feedback_count: z.number(),
  avg_rating: z.number().nullable(),
});

export const OrdersDailyPointSchema = z.object({
  day: z.string(),
  completed: z.number(),
  cancelled: z.number(),
  revenue: z.number(),
});

export const HeatmapCellSchema = z.object({
  weekday: z.number(),
  hour: z.number(),
  orders: z.number(),
});

export const ReasonCountSchema = z.object({
  reason: z.string(),
  orders: z.number(),
});

export const OrderSlaSchema = z.object({
  received: z.number(),
  accepted: z.number(),
  accept_median_sec: z.number().nullable(),
  accept_p90_sec: z.number().nullable(),
  prep_median_min: z.number().nullable(),
  prep_p90_min: z.number().nullable(),
});

export const ShopPerformanceSchema = z.object({
  shop_id: z.number(),
  shop_name: z.string(),
  partner_name: z.string(),
  orders: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  revenue: z.number(),
  avg_rating: z.number().nullable(),
  accept_median_sec: z.number().nullable(),
  prep_median_min: z.number().nullable(),
});

export const ChannelMetricSchema = z.object({
  label: z.string(),
  orders: z.number(),
  revenue: z.number(),
});

export const PromoSplitRowSchema = z.object({
  has_promo: z.boolean(),
  orders: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  revenue: z.number(),
  customers: z.number(),
});

export const PromoCodeMetricSchema = z.object({
  code: z.string(),
  orders: z.number(),
  revenue: z.number(),
  discount: z.number(),
  new_customers: z.number(),
});

export const CohortCellSchema = z.object({
  cohort: z.string(),
  offset: z.number(),
  users: z.number(),
});

export const RetentionSchema = z.object({
  repeat_customers: z.number(),
  first_time_customers: z.number(),
  second_order_within_30: z.number(),
  median_days_to_second: z.number().nullable(),
});

export const OrdersAnalyticsSchema = z.object({
  from: z.string(),
  to: z.string(),
  previous_from: z.string(),
  previous_to: z.string(),
  current: OrdersKpiSchema,
  previous: OrdersKpiSchema,
  daily: z.array(OrdersDailyPointSchema),
  heatmap: z.array(HeatmapCellSchema),
  cancel_reasons: z.array(ReasonCountSchema),
  cancelled_before_accept: z.number(),
  sla: OrderSlaSchema,
  shops: z.array(ShopPerformanceSchema),
  top_products: z.array(NamedMetricSchema),
  payments: z.array(ChannelMetricSchema),
  sources: z.array(ChannelMetricSchema),
  vendors: z.array(ChannelMetricSchema),
  promo_split: z.array(PromoSplitRowSchema),
  promo_discount: z.number(),
  promo_codes: z.array(PromoCodeMetricSchema),
  cohorts: z.array(CohortCellSchema),
  retention: RetentionSchema,
});

export type OrdersKpi = z.infer<typeof OrdersKpiSchema>;
export type OrdersDailyPoint = z.infer<typeof OrdersDailyPointSchema>;
export type HeatmapCell = z.infer<typeof HeatmapCellSchema>;
export type ReasonCount = z.infer<typeof ReasonCountSchema>;
export type OrderSla = z.infer<typeof OrderSlaSchema>;
export type ShopPerformance = z.infer<typeof ShopPerformanceSchema>;
export type ChannelMetric = z.infer<typeof ChannelMetricSchema>;
export type PromoSplitRow = z.infer<typeof PromoSplitRowSchema>;
export type PromoCodeMetric = z.infer<typeof PromoCodeMetricSchema>;
export type CohortCell = z.infer<typeof CohortCellSchema>;
export type Retention = z.infer<typeof RetentionSchema>;
export type OrdersAnalytics = z.infer<typeof OrdersAnalyticsSchema>;
