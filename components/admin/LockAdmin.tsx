import { lockAdmin } from '@/app/actions/admin-gate';
import shell from '../account/Account.module.css';

/** Under the admin section links: locks the admin area until the password is entered again. */
export function LockAdmin() {
  return (
    <form action={lockAdmin}>
      <button type="submit" className={`text-link ${shell.signOut}`}>
        Lock admin
      </button>
    </form>
  );
}
