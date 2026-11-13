import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow } from '../Eyebrow';
import styles from './Accessories.module.css';

type Box = { l: number; r: number; t: number; b: number };
type Item = { n: string; category: string; tag: string; alt: string; src: string; box: Box; label: { l: number; t: number } };

// Positions are % of the section box, measured on video frame 06 (spec §4.6 table, refined).
// Category numbers match item numbers (01 Bags is the bag, 06 Hats is the beret...).
const items: Item[] = [
  { n: '01', category: 'Bags', tag: 'bags', alt: 'Black leather pyramid tote', src: 'acc-bag', box: { l: 44, r: 60.5, t: 7.6, b: 34 }, label: { l: 54, t: 7.5 } },
  { n: '02', category: 'Belts', tag: 'belts', alt: 'Brown leather belt', src: 'acc-belt', box: { l: 7.9, r: 29.2, t: 29.3, b: 38 }, label: { l: 8.5, t: 23.5 } },
  { n: '03', category: 'Scarves', tag: 'scarves', alt: 'Printed silk scarf', src: 'acc-scarf', box: { l: 11.7, r: 22.4, t: 56.4, b: 85 }, label: { l: 5.9, t: 59.5 } },
  { n: '04', category: 'Glasses', tag: 'glasses', alt: 'Black rectangular sunglasses', src: 'acc-glasses', box: { l: 38.2, r: 65.2, t: 75.8, b: 89.3 }, label: { l: 65, t: 83.5 } },
  { n: '05', category: 'Jewelry', tag: 'jewelry', alt: 'Two stacked bangles', src: 'acc-bangles', box: { l: 80, r: 90.8, t: 62.5, b: 79 }, label: { l: 91, t: 60.5 } },
  { n: '06', category: 'Hats', tag: 'hats', alt: 'Red wool beret', src: 'acc-beret', box: { l: 70.4, r: 90.6, t: 28.4, b: 44.6 }, label: { l: 91, t: 28.5 } },
];

const pct = (v: number) => `${v}%`;

/**
 * Homepage §4.6: category list in the centre, six numbered cut-outs around it.
 * On desktop the six pieces travel slowly around the list on an oval path, staying upright.
 */
export function Accessories() {
  return (
    <section className={styles.section} aria-labelledby="accessories-title" data-loop>
      <div className={styles.centre}>
        <Eyebrow>
          <span id="accessories-title">Accessories</span>
        </Eyebrow>
        <ul className={styles.categories}>
          {items.map((it, i) => (
            <li key={it.n} data-reveal="rise" style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}>
              <Link href={`/accessories?type=${it.tag}`} className={styles.category} data-n={it.n}>
                <span className={styles.index}>({it.n})</span>
                {it.category}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ul className={styles.items}>
        {items.map((it, i) => (
          <li
            key={it.n}
            className={styles.item}
            data-n={it.n}
            data-reveal="fade"
            style={
              {
                '--reveal-delay': `${i * 80}ms`,
                '--l': pct(it.box.l),
                '--t': pct(it.box.t),
                '--w': pct(it.box.r - it.box.l),
                '--h': pct(it.box.b - it.box.t),
                // Label position, as % of the piece's own box (it travels with the piece).
                '--label-l': pct(((it.label.l - it.box.l) / (it.box.r - it.box.l)) * 100),
                '--label-t': pct(((it.label.t - it.box.t) / (it.box.b - it.box.t)) * 100),
              } as React.CSSProperties
            }
          >
            <div className={styles.itemBody}>
              <span className={styles.itemLabel} aria-hidden="true">
                ({it.n})
              </span>
              <div className={styles.itemMedia}>
                {/* Placeholder (A06–A11): local-only crop of the reference. Never ship. */}
                <Image src={`/placeholders/${it.src}.jpg`} alt={it.alt} fill sizes="(max-width: 767px) 45vw, 27vw" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
