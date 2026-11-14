'use client';

import { useId, useState } from 'react';
import { SIZE_CHART } from '@/lib/sizes';
import { Drawer } from '../Drawer';
import styles from './SizeGuide.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Sizes this piece comes in; the finder only suggests from these. */
  sizes: string[];
  /** Called when the visitor takes the suggested size. */
  onPick: (size: string) => void;
};

/** The size of the chart row that fits all three measurements (the next one up if between two). */
function suggest(bust: number, waist: number, hips: number, sizes: string[]): string | null {
  if (!bust && !waist && !hips) return null;
  const rows = SIZE_CHART.filter((r) => sizes.includes(r.size));
  if (rows.length === 0) return null;
  const fit = rows.find((r) => (!bust || bust <= r.bust) && (!waist || waist <= r.waist) && (!hips || hips <= r.hips));
  return (fit ?? rows[rows.length - 1]).size;
}

/**
 * Size guide in a drawer: the chart, and a small finder that turns three measurements into a
 * size. Placeholder chart (lib/sizes.ts) until the brand's own is supplied.
 */
export function SizeGuide({ open, onClose, sizes, onPick }: Props) {
  const id = useId();
  const [m, setM] = useState({ bust: '', waist: '', hips: '' });
  const num = (v: string) => Math.max(0, Math.min(200, Number(v) || 0));
  const result = suggest(num(m.bust), num(m.waist), num(m.hips), sizes);
  const field = (k: keyof typeof m, label: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        placeholder="cm"
        value={m[k]}
        onChange={(e) => setM({ ...m, [k]: e.target.value.replace(/\D/g, '').slice(0, 3) })}
      />
    </label>
  );

  return (
    <Drawer open={open} onClose={onClose} side="right" label="Size guide">
      <div className={styles.wrap}>
        <h2 className={styles.title}>Size guide</h2>

        <section aria-labelledby={`${id}-find`}>
          <h3 id={`${id}-find`} className={styles.heading}>
            Find my size
          </h3>
          <p className={styles.hint}>Measure over light clothing, in centimetres. Fill in any or all three.</p>
          <div className={styles.fields}>
            {field('bust', 'Bust')}
            {field('waist', 'Waist')}
            {field('hips', 'Hips')}
          </div>
          <div className={styles.result} role="status" aria-live="polite">
            {result ? (
              <>
                <p>
                  Your size: <strong>{result}</strong>
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    onPick(result);
                    onClose();
                  }}
                >
                  Select {result}
                </button>
              </>
            ) : (
              <p className={styles.hint}>Your suggested size appears here.</p>
            )}
          </div>
        </section>

        <section aria-labelledby={`${id}-chart`}>
          <h3 id={`${id}-chart`} className={styles.heading}>
            Measurements
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Size</th>
                <th scope="col">Bust</th>
                <th scope="col">Waist</th>
                <th scope="col">Hips</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.size} data-mine={r.size === result || undefined} data-off={!sizes.includes(r.size) || undefined}>
                  <th scope="row">{r.size}</th>
                  <td>{r.bust} cm</td>
                  <td>{r.waist} cm</td>
                  <td>{r.hips} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.hint}>Between two sizes? Take the larger for an easier fit.</p>
        </section>
      </div>
    </Drawer>
  );
}
