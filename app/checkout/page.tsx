import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { CheckoutView } from '@/components/shop/CheckoutView';
import { authEnabled } from '@/lib/auth-config';
import { getCatalog } from '@/lib/catalog';
import { ensureProfile, signedInUserId } from '@/lib/customer';
import { razorpayConfigured } from '@/lib/razorpay';
import { adminDb } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Checkout · House of Kanishka',
  robots: { index: false, follow: false },
};

/**
 * Checkout: guests are welcome; a signed-in customer finds their email and saved addresses
 * already there. Amounts shown here are a preview: the server works them out again from the
 * database when the order is placed.
 */
export default async function CheckoutPage() {
  const [{ settings }, userId] = await Promise.all([getCatalog(), signedInUserId()]);

  let account: React.ComponentProps<typeof CheckoutView>['account'] = null;
  if (userId) {
    const profile = await ensureProfile(userId);
    const { data } = await adminDb()
      .from('addresses')
      .select('id, full_name, phone, line1, line2, city, state, pincode, is_default')
      .eq('clerk_user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    account = {
      email: profile.email ?? '',
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' '),
      addresses: data ?? [],
    };
  }

  return (
    <>
      <Header />
      <main className="page">
        <CheckoutView
          account={account}
          canSignIn={authEnabled && !userId}
          onlineOpen={razorpayConfigured}
          codOpen={settings.codEnabled}
          codMax={settings.codMaxOrder}
          shippingFee={settings.shippingFee}
        />
      </main>
    </>
  );
}
