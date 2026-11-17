import { Emblem } from '../Emblem';

type Props = {
  pending: boolean;
  /** Read out by screen readers while the lotus is showing. */
  busyLabel: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

/** A submit button whose label gives way to the opening lotus while the form is being sent. */
export function SubmitButton({ pending, busyLabel, className = 'btn btn-black', children, type = 'submit', ...rest }: Props) {
  return (
    <button type={type} className={className} disabled={pending || rest.disabled} aria-busy={pending} {...rest}>
      {pending ? (
        <>
          <Emblem bloom="load" className="btn-emblem" />
          <span className="visually-hidden">{busyLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
