import { ensureProfile, signedInUserId } from '@/lib/customer';
import { adminDb } from '@/lib/supabase/server';

/**
 * "Download my data" (DPDP Act): everything we hold about the signed-in customer, as one
 * JSON file. Sign-in details (password, devices) are held by Clerk, not by us.
 */
export async function GET() {
  const userId = await signedInUserId();
  if (!userId) return new Response('Please sign in.', { status: 401 });

  const profile = await ensureProfile(userId);
  const db = adminDb();
  const [addresses, bag, wishlist, newsletter, consent] = await Promise.all([
    db.from('addresses').select('full_name, phone, line1, line2, city, state, pincode, country, is_default, created_at').eq('clerk_user_id', userId),
    db.from('bag_items').select('qty, updated_at, product_variants(size, products(name, slug))').eq('clerk_user_id', userId),
    db.from('wishlist_items').select('created_at, products(name, slug)').eq('clerk_user_id', userId),
    profile.email ? db.from('newsletter_subscribers').select('email, status, created_at, confirmed_at, unsubscribed_at').eq('email', profile.email) : null,
    db.from('consent_log').select('kind, granted, source, created_at').eq('clerk_user_id', userId).order('created_at'),
  ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      profile: {
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        marketing_opt_in: profile.marketing_opt_in,
        created_at: profile.created_at,
      },
      addresses: addresses.data ?? [],
      bag: bag.data ?? [],
      wishlist: wishlist.data ?? [],
      newsletter: newsletter?.data ?? [],
      consent_log: consent.data ?? [],
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="house-of-kanishka-my-data.json"',
      'Cache-Control': 'no-store',
    },
  });
}
