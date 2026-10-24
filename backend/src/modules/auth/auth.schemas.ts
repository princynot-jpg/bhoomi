import { z } from "zod";

const optionalScope = z.string().trim().min(1).max(160).optional();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  agency: optionalScope,
  position: optionalScope,
  state: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
}).strict();

export const loginSchema = z.object({
  email: z.email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
