import { Emblem } from '../Emblem';
import { Header } from '../Header';
import styles from './Skeleton.module.css';

/** The red hairline that travels under the header while a page is on its way. */
function Bar() {
  return <div className={styles.bar} aria-hidden="true" />;
}

/** Announces the wait to screen readers once; the shapes themselves are decorative. */
function Status({ label }: { label: string }) {
  return (
    <p className="visually-hidden" role="status">
      {label}
    </p>
  );
}

/** A product listing: title, filter row and a grid of photo tiles with two caption lines each. */
export function ListingSkeleton({ columns = 5, count = 10 }: { columns?: 4 | 5; count?: number }) {
  return (
    <>
      <Header />
      <main className={styles.root} aria-busy="true">
        <Status label="Loading" />
        <Bar />
        <div className={styles.titleRow} aria-hidden="true">
          <div className={styles.title} />
        </div>
        <div className={styles.toolbar} aria-hidden="true">
          <span className={styles.line} />
          <span className={styles.line} />
          <span className={styles.line} />
        </div>
        <ul className={styles.grid} data-columns={columns} aria-hidden="true">
          {Array.from({ length: count }, (_, i) => (
            <li key={i} className={styles.card}>
              <div className={`${styles.tile} ${styles.media}`}>
                <Emblem bloom="none" className={styles.mark} />
              </div>
              <div className={styles.caption}>
                <span className={styles.line} />
                <span className={styles.line} />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

/** A product page: title and details above a row of tall photo tiles. */
export function ProductSkeleton() {
  return (
    <>
      <Header />
      <main className={`${styles.root} ${styles.pdp}`} aria-busy="true">
        <Status label="Loading" />
        <Bar />
        <div className={styles.pdpTitle} aria-hidden="true">
          <div className={styles.title} />
          <div className={styles.title} />
        </div>
        <div className={styles.pdpInfo} aria-hidden="true">
          <span className={styles.line} />
          <span className={styles.line} />
          <span className={styles.line} />
          <div className={styles.select} />
          <div className={styles.select} />
          <div className={styles.cta} />
        </div>
        <div className={styles.pdpGallery} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.tile}>
              <Emblem bloom="none" className={styles.mark} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

/** Any other page: a title and a few lines of text. */
export function PageSkeleton() {
  return (
    <>
      <Header />
      <main className={`${styles.root} ${styles.plain}`} aria-busy="true">
        <Status label="Loading" />
        <Bar />
        <div className={styles.title} aria-hidden="true" />
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={styles.line} aria-hidden="true" />
        ))}
      </main>
    </>
  );
}
