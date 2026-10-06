import { config } from 'dotenv';
import { z } from 'zod';

config();

const INSECURE_DEFAULT_SECRETS = [
  'default_jwt_secret_do_not_use_in_production_32chars',
  'default_jwt_refresh_secret_do_not_use_in_production',
  '12345678901234567890123456789012',
  'secretsecretsecretsecretsecretsecret',
];

const emptyToUndefined = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

const optionalNonEmpty = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional());
const optionalSecret = z.preprocess(emptyToUndefined, z.string().min(32).optional());
const optionalGeneral = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: optionalGeneral,

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Google OAuth & Maps Platform
  GOOGLE_CLIENT_ID: optionalNonEmpty,
  GOOGLE_CLIENT_SECRET: optionalNonEmpty,
  GOOGLE_MAPS_API_KEY: optionalGeneral,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
  CLOUDINARY_API_KEY: optionalNonEmpty,
  CLOUDINARY_API_SECRET: optionalNonEmpty,

  // Firebase
  FIREBASE_PROJECT_ID: optionalNonEmpty,
  FIREBASE_PRIVATE_KEY: optionalNonEmpty,
  FIREBASE_CLIENT_EMAIL: optionalEmail,

  // Email
  SENDGRID_API_KEY: optionalGeneral,
  EMAIL_FROM: z.string().email().default('noreply@petverse.app'),

  // SMS Provider — India-first: MSG91 / 2Factor (Twilio kept as fallback)
  TWILIO_ACCOUNT_SID: optionalGeneral,
  TWILIO_AUTH_TOKEN: optionalGeneral,
  TWILIO_PHONE_NUMBER: optionalGeneral,
  AWS_SNS_REGION: optionalGeneral,
  // India SMS: MSG91
  MSG91_API_KEY: optionalGeneral,
  MSG91_SENDER_ID: optionalGeneral,
  MSG91_TEMPLATE_ID: optionalGeneral,
  // India SMS: 2Factor
  TWOFACTOR_API_KEY: optionalGeneral,

  // AI Service & Gemini
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_INTERNAL_KEY: optionalSecret,
  GEMINI_API_KEY: optionalGeneral,
  GEMINI_MODEL: optionalGeneral,

  // Payment Provider — India-first: Razorpay (Stripe kept as international fallback)
  RAZORPAY_KEY_ID: optionalGeneral,
  RAZORPAY_KEY_SECRET: optionalGeneral,
  RAZORPAY_WEBHOOK_SECRET: optionalGeneral,
  // International fallback: Stripe
  STRIPE_SECRET_KEY: optionalGeneral,
  STRIPE_WEBHOOK_SECRET: optionalGeneral,

  // Rate Limiting
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(100),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:');
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });
    process.exit(1);
  }

  const data = result.data;

  // Enforce production security guardrails
  if (data.NODE_ENV === 'production') {
    const issues: string[] = [];

    if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
      issues.push('JWT_SECRET and JWT_REFRESH_SECRET must be different in production');
    }

    if (INSECURE_DEFAULT_SECRETS.includes(data.JWT_SECRET)) {
      issues.push('JWT_SECRET is using an insecure default placeholder string');
    }

    if (INSECURE_DEFAULT_SECRETS.includes(data.JWT_REFRESH_SECRET)) {
      issues.push('JWT_REFRESH_SECRET is using an insecure default placeholder string');
    }

    if (issues.length > 0) {
      console.error('❌ Production Security Violations:');
      issues.forEach((issue) => console.error(`  - ${issue}`));
      process.exit(1);
    }
  }

  return data;
}

export const env = loadEnv();

/**
 * Checks if a string is a genuine configured credential rather than a placeholder
 */
export function isConfiguredCredential(val?: string): val is string {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.includes('your-') || trimmed.includes('change_me') || trimmed.includes('placeholder')) {
    return false;
  }
  return true;
}

/**
 * Validates production readiness of external service configurations
 */
export function auditExternalServices(): {
  database: boolean;
  email: boolean;
  storage: boolean;
  push: boolean;
  oauth: boolean;
  ai: boolean;
  payments: boolean;
} {
  return {
    database: !!env.MONGODB_URI,
    email: isConfiguredCredential(env.SENDGRID_API_KEY),
    storage: !!(
      isConfiguredCredential(env.CLOUDINARY_CLOUD_NAME) &&
      isConfiguredCredential(env.CLOUDINARY_API_KEY) &&
      isConfiguredCredential(env.CLOUDINARY_API_SECRET)
    ),
    push: !!(
      isConfiguredCredential(env.FIREBASE_PROJECT_ID) &&
      isConfiguredCredential(env.FIREBASE_CLIENT_EMAIL) &&
      isConfiguredCredential(env.FIREBASE_PRIVATE_KEY)
    ),
    oauth: !!isConfiguredCredential(env.GOOGLE_CLIENT_ID),
    ai: !!(
      isConfiguredCredential(env.GEMINI_API_KEY) ||
      (isConfiguredCredential(env.AI_SERVICE_INTERNAL_KEY) && env.AI_SERVICE_URL !== 'http://localhost:8000')
    ),
    payments: !!(
      (isConfiguredCredential(env.RAZORPAY_KEY_ID) && isConfiguredCredential(env.RAZORPAY_KEY_SECRET)) ||
      (isConfiguredCredential(env.STRIPE_SECRET_KEY) && isConfiguredCredential(env.STRIPE_WEBHOOK_SECRET))
    ),
  };
}
