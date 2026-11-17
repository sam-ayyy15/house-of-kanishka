import { AccountHead } from '@/components/account/AccountHead';
import { AccountView } from '@/components/auth/AccountView';
import { requireUserId } from '@/lib/customer';

export default async function AccountSettingsPage() {
  await requireUserId('/account/settings');
  return (
    <>
      <AccountHead title="Settings" />
      <AccountView />
    </>
  );
}
