import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(64).refine(
    (secret) => !secret.startsWith("replace_with"),
    "Replace this placeholder with a random secret.",
  ),
  JWT_REFRESH_SECRET: z.string().min(64).refine(
    (secret) => !secret.startsWith("replace_with"),
    "Replace this placeholder with a random secret.",
  ),
  JWT_ACCESS_EXPIRES_IN: z.literal("15m").default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.literal("7d").default("7d"),
  CLIENT_URL: z.url(),
  CORS_ORIGINS: z.string().min(1),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid backend environment configuration: ${issues}`);
}

if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
