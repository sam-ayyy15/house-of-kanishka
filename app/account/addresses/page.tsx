import { AccountHead } from '@/components/account/AccountHead';
import { AddressBook } from '@/components/account/AddressBook';
import { ensureProfile, requireUserId } from '@/lib/customer';
import { adminDb } from '@/lib/supabase/server';

export default async function AccountAddressesPage() {
  const userId = await requireUserId('/account/addresses');
  const profile = await ensureProfile(userId);
  const { data } = await adminDb()
    .from('addresses')
    .select('id, full_name, phone, line1, line2, city, state, pincode, is_default')
    .eq('clerk_user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <>
      <AccountHead title="Addresses">Where your pieces should be delivered. We deliver within India.</AccountHead>
      <AddressBook addresses={data ?? []} defaultName={[profile.first_name, profile.last_name].filter(Boolean).join(' ')} />
    </>
  );
}
