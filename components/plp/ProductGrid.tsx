import Image from 'next/image';
import Link from 'next/link';
import { PDP_HREF, type Product } from '@/lib/products';
import styles from './ProductGrid.module.css';

/**
 * Cut-out product grid (spec §5): 5 columns desktop, 2 mobile, no captions (names and
 * prices are not visible in S2; [M]). Every card opens the only PDP that exists so far.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className={styles.grid}>
      {products.map((p) => (
        <li key={p.slug}>
          <Link href={PDP_HREF} className={styles.card}>
            <Image src={p.image} alt={p.name} fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 20vw" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
