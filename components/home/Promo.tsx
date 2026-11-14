import { Phone, RefreshCw, Truck } from 'lucide-react';
import { RiseWords } from '../RiseWords';
import { UnderlineLink } from '../UnderlineLink';
import { VideoBackground } from '../VideoBackground';
import styles from './Promo.module.css';

// Spec §4.7 copy; threshold in EUR (approved, Q7). All three links open the Help page,
// each at its own topic.
const services = [
  {
    Icon: Truck,
    title: 'Free Shipping',
    body: 'Enjoy free shipping on all orders above €350. Get your favorite styles delivered to your door.',
    link: 'View all', href: '/help#shipping',
  },
  {
    Icon: RefreshCw,
    title: 'Easy Returns',
    body: 'Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase.',
    link: 'Learn more', href: '/help#returns',
  },
  {
    Icon: Phone,
    title: '24/7 Customer Support',
    body: 'Have questions? Our customer support team is here to help you anytime, day or night.',
    link: 'Contact us', href: '/help#support',
  },
];

/** Homepage §4.7: full-bleed film, headline top-left, three services along the bottom. */
export function Promo() {
  return (
    <section className={styles.section} aria-labelledby="promo-title">
      {/* Client's own promo film: muted, loops continuously while the section is
          on screen (poster only with reduced motion or Save-Data). Made from reference/images/v2.MP4 by
          scripts/make-videos.mjs. */}
      <VideoBackground
        className={styles.photo}
        poster="/media/promo-poster.jpg"
        sources={[
          { src: '/media/promo.webm', type: 'video/webm; codecs="vp8"' },
          { src: '/media/promo.mp4', type: 'video/mp4' },
        ]}
      />
      <div className={styles.shade} aria-hidden="true" />

      <h2 id="promo-title" className={styles.headline} data-reveal="words">
        <RiseWords text="Up to 50% Off." />
        <br /> <RiseWords text="Don’t miss out" from={4} />
      </h2>

      <ul className={styles.services}>
        {services.map(({ Icon, title, body, link, href }, i) => (
          <li
            key={title}
            className={styles.service}
            data-reveal="rise"
            style={{ '--reveal-delay': `${350 + i * 110}ms` } as React.CSSProperties}
          >
            <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
            <UnderlineLink href={href} className={styles.link}>
              {link}
            </UnderlineLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
