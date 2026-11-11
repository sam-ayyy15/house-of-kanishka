import Image from 'next/image';
import { Phone, RefreshCw, Truck } from 'lucide-react';
import { UnderlineLink } from '../UnderlineLink';
import styles from './Promo.module.css';

// Spec §4.7 copy; threshold in EUR (approved, Q7).
const services = [
  {
    Icon: Truck,
    title: 'Free Shipping',
    body: 'Enjoy free shipping on all orders above €350. Get your favorite styles delivered to your door.',
    link: 'View all',
  },
  {
    Icon: RefreshCw,
    title: 'Easy Returns',
    body: 'Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase.',
    link: 'Learn more',
  },
  {
    Icon: Phone,
    title: '24/7 Customer Support',
    body: 'Have questions? Our customer support team is here to help you anytime, day or night.',
    link: 'Contact us',
  },
];

/** Homepage §4.7: full-bleed photo, headline top-left, three services along the bottom. */
export function Promo() {
  return (
    <section className={styles.section} aria-labelledby="promo-title">
      {/* Placeholder (A05): local-only crop of the reference. Never ship. */}
      <Image src="/placeholders/promo.jpg" alt="" fill sizes="100vw" className={styles.photo} />

      <h2 id="promo-title" className={styles.headline}>
        Up to 50% Off.
        <br /> Don’t miss out
      </h2>

      <ul className={styles.services}>
        {services.map(({ Icon, title, body, link }) => (
          <li key={title} className={styles.service}>
            <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
            <UnderlineLink href="#" className={styles.link}>
              {link}
            </UnderlineLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
