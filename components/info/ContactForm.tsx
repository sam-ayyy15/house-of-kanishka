'use client';

import { useActionState } from 'react';
import { sendContactMessage, type FormState } from '@/app/actions/forms';
import { Field, TextAreaField } from '../form/Field';
import { FormStatus, FormThanks } from '../form/FormStatus';
import { keepValues } from '../form/keep';
import { SubmitButton } from '../form/SubmitButton';
import { Turnstile } from '../form/Turnstile';

/** Contact form: the message is saved on the server (and copied to the shop's inbox). */
export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContactMessage, null);

  if (state?.ok) return <FormThanks message={state.message.replace(/^Thank you\.\s*/, '')} />;

  return (
    <form onSubmit={keepValues(action)}>
      {/* Left empty by people; see isBot() in app/actions/forms.ts. */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" />
      <Field label="Name" name="name" autoComplete="name" required maxLength={120} />
      <Field label="Email" type="email" name="email" autoComplete="email" required />
      <Field label="Order number (optional)" name="order" maxLength={40} />
      <TextAreaField label="Message" name="message" required maxLength={5000} />
      <Turnstile action="contact" resetKey={state} />
      <SubmitButton pending={pending} busyLabel="Sending…">
        Send message
      </SubmitButton>
      <FormStatus message={state && !state.ok ? state.message : null} />
    </form>
  );
}
