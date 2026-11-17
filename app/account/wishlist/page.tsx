import { AccountHead } from '@/components/account/AccountHead';
import { AccountWishlist } from '@/components/account/AccountWishlist';
import { requireUserId } from '@/lib/customer';

export default async function AccountWishlistPage() {
  await requireUserId('/account/wishlist');
  return (
    <>
      <AccountHead title="Wishlist" />
      <AccountWishlist />
    </>
  );
}
