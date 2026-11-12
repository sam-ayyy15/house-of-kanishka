import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { LoginView } from '@/components/shop/LoginView';

export const metadata: Metadata = { title: 'Login · House of Kanishka' };

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        <LoginView />
      </main>
    </>
  );
}
