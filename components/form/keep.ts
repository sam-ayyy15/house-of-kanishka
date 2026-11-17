import { startTransition } from 'react';

/**
 * Submits a form to a server action without the browser clearing the fields afterwards.
 * (A form given `action={…}` is reset once the action finishes, which throws away what the
 * customer typed when the server answers with an error.) Use as `onSubmit={keepValues(action)}`
 * with the dispatcher from useActionState; its pending flag works as usual.
 */
export function keepValues(action: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => action(form));
  };
}
