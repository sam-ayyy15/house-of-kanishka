'use client';

import { useEffect, useRef } from 'react';
import styles from './Drawer.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  label: string;
  children: React.ReactNode;
};

/**
 * Side panel built on <dialog>: the browser handles focus trapping, Escape and
 * returning focus to the trigger. Slides in from its edge; see Drawer.module.css.
 */
export function Drawer({ open, onClose, side = 'left', label, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.drawer}
      data-side={side}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog itself (not the panel) is a click on the backdrop.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    </dialog>
  );
}
