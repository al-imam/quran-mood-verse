import { z } from "zod"

const isServer = typeof window === "undefined"

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_ORIGIN: z.string().url().default("http://localhost:3050"),

  GEMINI_API_KEY: isServer ? z.string() : z.string().optional(),
  QURAN_FOUNDATION_CLIENT_ID: isServer ? z.string() : z.string().optional(),
  QURAN_FOUNDATION_CLIENT_SECRET: isServer ? z.string() : z.string().optional(),

  QURAN_FOUNDATION_OAUTH_BASE_URL: isServer ? z.string().url() : z.string().url().optional(),
  QURAN_FOUNDATION_API_BASE_URL: isServer ? z.string().url() : z.string().url().optional(),

  NODE_ENV: z.enum(["development", "staged", "production"]).default("development"),
})

export const env = clientEnvSchema.parse({
  ...process.env,

  /* Public Envs need to be explicit, because they are spreadable on client side */
  NEXT_PUBLIC_ORIGIN: process.env.NEXT_PUBLIC_ORIGIN,
})

export const IS_DEV = env.NODE_ENV === "development"
