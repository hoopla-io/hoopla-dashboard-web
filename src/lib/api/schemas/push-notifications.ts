import { z } from "zod";

export const PushNotificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  user: z
    .object({
      id: z.number(),
      name: z.string(),
      phone_number: z.string(),
    })
    .nullable(),
  kind: z.string(),
  reference_id: z.number(),
  attempt: z.number(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.string()).nullable(),
  status: z.string(),
  error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PushNotificationKindStatsSchema = z.object({
  kind: z.string(),
  total: z.number(),
  sent: z.number(),
  failed: z.number(),
  skipped_no_token: z.number(),
  pending: z.number(),
});

export const PushNotificationStatsSchema = z.object({
  total: z.number(),
  sent: z.number(),
  failed: z.number(),
  skipped_no_token: z.number(),
  pending: z.number(),
  kinds: z.array(PushNotificationKindStatsSchema),
});

export type PushNotification = z.infer<typeof PushNotificationSchema>;
export type PushNotificationKindStats = z.infer<typeof PushNotificationKindStatsSchema>;
export type PushNotificationStats = z.infer<typeof PushNotificationStatsSchema>;
