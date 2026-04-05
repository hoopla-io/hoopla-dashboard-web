import { z } from "zod";

export const StoryItemSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  link_type: z.string().nullable().optional(),
  link_value: z.string().nullable().optional(),
  sort_order: z.number(),
  duration: z.number(),
});

export const StorySchema = z.object({
  id: z.number(),
  title: z.string(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  item_count: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export const StoryWithItemsSchema = StorySchema.extend({
  items: z.array(StoryItemSchema).optional(),
});

export const CreateStorySchema = z.object({
  title: z.string(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const CreateStoryItemSchema = z.object({
  story_id: z.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  link_type: z.string().optional(),
  link_value: z.string().optional(),
  sort_order: z.number().optional(),
  duration: z.number().optional(),
});

export type StoryItem = z.infer<typeof StoryItemSchema>;
export type Story = z.infer<typeof StorySchema>;
export type StoryWithItems = z.infer<typeof StoryWithItemsSchema>;
export type CreateStoryRequest = z.infer<typeof CreateStorySchema>;
export type UpdateStoryRequest = Partial<CreateStoryRequest>;
export type CreateStoryItemRequest = z.infer<typeof CreateStoryItemSchema>;
export type UpdateStoryItemRequest = Partial<Omit<CreateStoryItemRequest, "story_id">>;
