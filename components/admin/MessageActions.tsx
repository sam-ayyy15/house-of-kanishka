'use client';

import { useTransition } from 'react';
import { setMessageStatus } from '@/app/actions/admin';
import styles from './Admin.module.css';

export function MessageActions({ id, status, email }: { id: string; status: string; email: string }) {
  const [pending, start] = useTransition();
  const set = (next: 'new' | 'answered' | 'closed') => start(async () => void (await setMessageStatus(id, next)));
  return (
    <div className={styles.messageActions}>
      <span className={styles.tag} data-tone={status === 'new' ? 'red' : undefined}>
        {status}
      </span>
      <a href={`mailto:${email}`} className="text-link">
        Reply
      </a>
      {status === 'new' ? (
        <button type="button" className="text-link" disabled={pending} onClick={() => set('answered')}>
          Mark answered
        </button>
      ) : (
        <button type="button" className="text-link" disabled={pending} onClick={() => set('new')}>
          Mark new
        </button>
      )}
    </div>
  );
}
