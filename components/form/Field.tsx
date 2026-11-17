import { useId } from 'react';

type Common = { label: string; error?: string; className?: string };

/**
 * A form field in the site's `.field` design with the customer-form motion (globals.css,
 * "Customer forms"): the label floats up from inside the field, a red line draws under it on
 * focus, and an error eases down beneath it. `placeholder=" "` is what lets CSS tell an
 * empty field from a filled one.
 */
export function Field({ label, error, className, ...input }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label className={`field field-float ${className ?? ''}`} data-invalid={error ? '' : undefined}>
      <span>{label}</span>
      <input placeholder=" " aria-invalid={error ? true : undefined} aria-describedby={error ? id : undefined} {...input} />
      <b className="field-line" aria-hidden="true" />
      {error && (
        <small id={id} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

export function TextAreaField({ label, error, className, ...input }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <label className={`field field-float ${className ?? ''}`} data-invalid={error ? '' : undefined}>
      <span>{label}</span>
      <textarea placeholder=" " aria-invalid={error ? true : undefined} aria-describedby={error ? id : undefined} {...input} />
      <b className="field-line" aria-hidden="true" />
      {error && (
        <small id={id} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

/** A select never has an empty resting state, so its label always sits above it. */
export function SelectField({ label, error, className, children, ...input }: Common & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <label className={`field field-float ${className ?? ''}`} data-invalid={error ? '' : undefined}>
      <span>{label}</span>
      <select aria-invalid={error ? true : undefined} aria-describedby={error ? id : undefined} {...input}>
        {children}
      </select>
      <b className="field-line" aria-hidden="true" />
      {error && (
        <small id={id} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}
