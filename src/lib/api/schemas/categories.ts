import { z } from "zod";

export const CategoryLanguageSchema = z.enum(["ru", "uz", "en"]);

export const CategoryTranslationSchema = z.object({
  id: z.number(),
  language: CategoryLanguageSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  translations: z.array(CategoryTranslationSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CategoryLanguage = z.infer<typeof CategoryLanguageSchema>;
export type CategoryTranslation = z.infer<typeof CategoryTranslationSchema>;
export type Category = z.infer<typeof CategorySchema>;

export type CategoryTranslationInput = {
  language: CategoryLanguage;
  name: string;
  description?: string | null;
};

export type SaveCategoryRequest = {
  translations: CategoryTranslationInput[];
};
