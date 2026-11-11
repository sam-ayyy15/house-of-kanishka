import Link from 'next/link';
import styles from './UnderlineLink.module.css';

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Uppercase sans link with a 1px underline the full width of the text (spec §3.3). */
export function UnderlineLink({ href, children, className }: Props) {
  return (
    <Link href={href} className={`${styles.link} ${className ?? ''}`}>
      {children}
    </Link>
  );
}
