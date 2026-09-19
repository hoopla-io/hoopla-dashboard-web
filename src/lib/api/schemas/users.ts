import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  balance: z.number().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  phone_number: z.string().optional(),
  mobile_provider: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const UserStatsSchema = z.object({
  orders_count: z.number(),
  completed_orders: z.number(),
  cancelled_orders: z.number(),
  total_spent: z.number(),
  cashback_earned: z.number(),
  cashback_used: z.number(),
  last_order_at: z.string().nullable(),
  sessions_count: z.number(),
  feedbacks_count: z.number(),
  average_rating: z.number(),
});

export const UserDetailSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  gender: z.string(),
  date_of_birth: z.string(),
  phone_number: z.string(),
  mobile_provider: z.string(),
  balance: z.number(),
  cashback_balance: z.number(),
  stats: UserStatsSchema,
  created_at: z.string(),
});

export const UserTransactionSchema = z.object({
  id: z.number(),
  transaction_type: z.string(),
  transaction_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_type: z.string(),
  description: z.string(),
  created_at: z.string().nullable(),
});

export const UserTransactionTotalsSchema = z.object({
  debit: z.number(),
  credit: z.number(),
});

export const UserSessionSchema = z.object({
  id: z.number(),
  device_name: z.string(),
  platform: z.string(),
  device_id: z.string(),
  app_version: z.string(),
  user_agent: z.string(),
  ip: z.string(),
  has_push: z.boolean(),
  created_at: z.string(),
  last_used_at: z.string(),
});

export const UserFeedbackSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  partner_id: z.number(),
  partner: z.string(),
  shop_id: z.number(),
  shop: z.string(),
  rating: z.number(),
  comment: z.string().nullable(),
  created_at: z.string(),
});

export const UserPromocodeRedemptionSchema = z.object({
  id: z.number(),
  promocode_id: z.number(),
  code: z.string(),
  order_id: z.number(),
  discount_amount: z.number(),
  created_at: z.string().nullable(),
});

export const EditUserSchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  mobile_provider: z.string().optional(),
});

export const FilterUserSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  mobile_provider: z.string().optional(),
  credit: z.number().optional(),
  debit: z.number().optional(),
  date_of_birth: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type EditUserRequest = z.infer<typeof EditUserSchema>;
export type FilterUserRequest = z.infer<typeof FilterUserSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
export type UserTransaction = z.infer<typeof UserTransactionSchema>;
export type UserTransactionTotals = z.infer<typeof UserTransactionTotalsSchema>;
export type UserSession = z.infer<typeof UserSessionSchema>;
export type UserFeedback = z.infer<typeof UserFeedbackSchema>;
export type UserPromocodeRedemption = z.infer<typeof UserPromocodeRedemptionSchema>;
