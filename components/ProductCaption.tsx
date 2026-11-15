import { formatPrice } from '@/lib/format';
import styles from './ProductCaption.module.css';

type Props = { name: string; price: number; align?: 'left' | 'center'; className?: string };

/** Product name (uppercase, medium) with the price on the line below (spec §3.5). */
export function ProductCaption({ name, price, align = 'left', className }: Props) {
  return (
    <p className={`${styles.caption} ${className ?? ''}`} style={{ textAlign: align }}>
      <span className={styles.name}>{name}</span>
      <span className={styles.price}>{formatPrice(price)}</span>
    </p>
  );
}
