import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  mobile_provider: z.string().optional(),
  credit: z.number().optional(),
  debit: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const EditUserSchema = z.object({
  name: z.string().optional(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(), // YYYY-MM-DD
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
