import { z } from "zod";

export const NotificationTranslationSchema = z.object({
  id: z.number(),
  language: z.enum(["uz", "ru", "en"]),
  title: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
});

export const NotificationSchema = z.object({
  id: z.number(),
  title: z.string(),
  text: z.string(),
  url: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  translations: z.array(NotificationTranslationSchema).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const CreateNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  text: z.string().min(1, "Text is required"),
  url: z.string().optional(),
});

export const UpdateNotificationSchema = CreateNotificationSchema.partial();

export const CreateTranslationSchema = z.object({
  notification_id: z.number(),
  language: z.enum(["uz", "ru", "en"]),
  title: z.string().optional(),
  text: z.string().optional(),
});

export const UpdateTranslationSchema = CreateTranslationSchema.omit({ notification_id: true }).partial();

export type NotificationTranslation = z.infer<typeof NotificationTranslationSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type CreateNotificationRequest = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotificationRequest = z.infer<typeof UpdateNotificationSchema>;
export type CreateTranslationRequest = z.infer<typeof CreateTranslationSchema>;
export type UpdateTranslationRequest = z.infer<typeof UpdateTranslationSchema>;
