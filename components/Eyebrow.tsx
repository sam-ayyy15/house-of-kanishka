import styles from './Eyebrow.module.css';

/** Small uppercase sans label above headlines (spec §2.2 `eyebrow`). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`${styles.eyebrow} ${className ?? ''}`}>{children}</p>;
}
