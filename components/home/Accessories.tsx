import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow } from '../Eyebrow';
import styles from './Accessories.module.css';

type Box = { l: number; r: number; t: number; b: number };
type Item = { n: string; category: string; alt: string; src: string; box: Box; label: { l: number; t: number } };

// Positions are % of the section box, measured on video frame 06 (spec §4.6 table, refined).
// Category numbers match item numbers (01 Bags is the bag, 06 Hats is the beret...).
const items: Item[] = [
  { n: '01', category: 'Bags', alt: 'Black leather pyramid tote', src: 'acc-bag', box: { l: 44, r: 60.5, t: 7.6, b: 34 }, label: { l: 54, t: 7.5 } },
  { n: '02', category: 'Belts', alt: 'Brown leather belt', src: 'acc-belt', box: { l: 7.9, r: 29.2, t: 29.3, b: 38 }, label: { l: 8.5, t: 23.5 } },
  { n: '03', category: 'Scarves', alt: 'Printed silk scarf', src: 'acc-scarf', box: { l: 11.7, r: 22.4, t: 56.4, b: 85 }, label: { l: 5.9, t: 59.5 } },
  { n: '04', category: 'Glasses', alt: 'Black rectangular sunglasses', src: 'acc-glasses', box: { l: 38.2, r: 65.2, t: 75.8, b: 89.3 }, label: { l: 65, t: 83.5 } },
  { n: '05', category: 'Jewelry', alt: 'Two stacked bangles', src: 'acc-bangles', box: { l: 80, r: 90.8, t: 62.5, b: 79 }, label: { l: 91, t: 60.5 } },
  { n: '06', category: 'Hats', alt: 'Red wool beret', src: 'acc-beret', box: { l: 70.4, r: 90.6, t: 28.4, b: 44.6 }, label: { l: 91, t: 28.5 } },
];

const pct = (v: number) => `${v}%`;

/** Homepage §4.6: category list in the centre, six numbered cut-outs scattered around it. */
export function Accessories() {
  return (
    <section className={styles.section} aria-labelledby="accessories-title">
      <div className={styles.centre}>
        <Eyebrow>
          <span id="accessories-title">Accessories</span>
        </Eyebrow>
        <ul className={styles.categories}>
          {items.map((it) => (
            <li key={it.n}>
              <Link href="#" className={styles.category}>
                <span className={styles.index}>({it.n})</span>
                {it.category}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.items}>
        {items.map((it) => (
          <li
            key={it.n}
            className={styles.item}
            style={
              {
                '--l': pct(it.box.l),
                '--t': pct(it.box.t),
                '--w': pct(it.box.r - it.box.l),
                '--h': pct(it.box.b - it.box.t),
                '--label-l': pct(it.label.l),
                '--label-t': pct(it.label.t),
              } as React.CSSProperties
            }
          >
            <span className={styles.itemLabel} aria-hidden="true">
              ({it.n})
            </span>
            <div className={styles.itemMedia}>
              {/* Placeholder (A06–A11): local-only crop of the reference. Never ship. */}
              <Image src={`/placeholders/${it.src}.jpg`} alt={it.alt} fill sizes="(max-width: 767px) 45vw, 27vw" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
