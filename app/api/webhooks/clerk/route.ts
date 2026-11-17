import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { NextRequest } from 'next/server';
import { eraseCustomer, saveProfile } from '@/lib/customer';

/**
 * Clerk → our database. Clerk calls this address whenever an account is created, changed
 * or deleted, and the `profiles` table is kept in step.
 *
 * Set up in the Clerk dashboard → Webhooks → Add endpoint:
 *   URL     https://<the site's address>/api/webhooks/clerk
 *   Events  user.created, user.updated, user.deleted
 * and copy its "Signing secret" into CLERK_WEBHOOK_SIGNING_SECRET.
 *
 * Every call is checked against that secret, so nobody else can post here. Handling is
 * safe to repeat: Clerk retries a delivery until it gets a 2xx answer.
 */
export async function POST(req: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return new Response('Webhook secret not set', { status: 503 });
  }

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const u = evt.data;
    const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0];
    const { error } = await saveProfile({
      id: u.id,
      email: primary?.email_address ?? null,
      firstName: u.first_name,
      lastName: u.last_name,
    });
    if (error) return new Response('Could not save the profile', { status: 500 });
  } else if (evt.type === 'user.deleted' && evt.data.id) {
    const { error } = await eraseCustomer(evt.data.id);
    if (error) return new Response('Could not erase the profile', { status: 500 });
  }

  return new Response('ok');
}
