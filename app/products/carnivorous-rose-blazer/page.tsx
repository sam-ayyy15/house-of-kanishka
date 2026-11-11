import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { PdpGallery } from '@/components/pdp/PdpGallery';
import { PdpInfo } from '@/components/pdp/PdpInfo';
import { blazer } from '@/lib/products';
import styles from './page.module.css';

export const metadata: Metadata = { title: `${blazer.name} · House of Kanishka` };

/** PDP (spec §6, S1). Mobile order: title → gallery → tabs → selects → purchase (approved). */
export default function ProductPage() {
  return (
    <>
      <Header />
      <main className={`page-solid ${styles.main}`}>
        <h1 className={styles.title}>{blazer.name}</h1>
        <div className={styles.info}>
          <PdpInfo product={blazer} />
        </div>
        <div className={styles.gallery}>
          <PdpGallery images={blazer.gallery} />
        </div>
      </main>
    </>
  );
}
