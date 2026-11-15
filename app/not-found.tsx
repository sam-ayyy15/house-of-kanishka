import Link from 'next/link';
import { Cloth } from '@/components/errors/Cloth';
import styles from '@/components/errors/Errors.module.css';
import { Emblem } from '@/components/Emblem';
import { Header } from '@/components/Header';

/**
 * 404. EXTRAPOLATED – no reference design. A length of brand-red satin hangs behind the words
 * (live 3D where the device allows it, a drawn version otherwise), with the lotus opening above.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className={styles.stage}>
        <div className={styles.backdrop}>
          <Cloth />
        </div>
        <div className={styles.copy}>
          <Emblem bloom="load" className={styles.lotus} />
          <p className={styles.script} aria-hidden="true">
            Lost in the folds
          </p>
          <h1 className={styles.title}>This page has moved on</h1>
          <p className={styles.lede}>The piece or page you’re looking for isn’t here any more.</p>
          <div className={styles.actions}>
            <Link href="/new-arrivals" className={`btn ${styles.btnLight}`}>
              Shop new arrivals
            </Link>
            <Link href="/" className={`text-link ${styles.linkLight}`}>
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
