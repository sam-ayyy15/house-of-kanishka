import 'server-only';
import { z } from 'zod';

/**
 * Server environment, checked once on first use. A missing or malformed value fails loudly
 * with the variable's name, instead of surfacing later as an odd runtime error.
 * Optional services (payments, email, shipping) stay optional until their phase is built.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),

  // Clerk (accounts). Optional: without them the site runs with accounts switched off.
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),

  // Supabase (database + storage).
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),

  // Razorpay (online payment). Optional: without the keys only cash on delivery is offered.
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // The founder's Clerk user id: the only account that can open the admin area.
  FOUNDER_CLERK_USER_ID: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  // A line left empty in .env ("KEY=") means "not set yet", the same as leaving it out.
  const filled = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
  const parsed = schema.safeParse(filled);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Missing or invalid environment variables: ${names}. See .env.example.`);
  }
  return (cached = parsed.data);
}

/** True when the database keys are present (lets pages fall back gracefully in a bare checkout). */
export const databaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !!process.env.SUPABASE_SECRET_KEY;
