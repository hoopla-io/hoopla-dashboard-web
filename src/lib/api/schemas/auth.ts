import { z } from "zod";

export const LoginRequestSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string().optional(),
    login: z.string().optional(),
  }).optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  mobile_provider: z.string().optional(),
  credit: z.number().optional(),
  debit: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
