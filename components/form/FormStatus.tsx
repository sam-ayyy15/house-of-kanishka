import { Emblem } from '../Emblem';
import { Handwriting } from '../Handwriting';

/**
 * The line under a form. Its space is always reserved; a message eases down into it
 * (never shakes). Errors are red, confirmations black.
 */
export function FormStatus({ message, ok = false, className }: { message?: string | null; ok?: boolean; className?: string }) {
  return (
    <p key={message ?? ''} className={`form-status ${className ?? ''}`} data-tone={ok ? 'ok' : 'error'} role={ok ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

/** Shown in place of a form once it has been sent: the lotus opens and a thank-you is written in script. */
export function FormThanks({ script = 'Thank you', message }: { script?: string; message: string }) {
  return (
    <div className="form-thanks" role="status">
      <Emblem bloom="load" />
      <p className="form-thanks-script" data-write="load" style={{ '--write-delay': '500ms' } as React.CSSProperties}>
        <Handwriting text={script} />
      </p>
      <p>{message}</p>
    </div>
  );
}
