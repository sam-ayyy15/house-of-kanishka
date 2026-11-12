'use client';

import { useState } from 'react';

/** Contact form. Not connected to a helpdesk or mailbox yet: it validates, then says so. */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="name" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Order number (optional)</span>
        <input name="order" />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required />
      </label>
      <button type="submit" className="btn btn-black">
        Send message
      </button>
      <p className="status" role="status">
        {sent && 'This form isn’t connected to an inbox yet, so your message wasn’t sent.'}
      </p>
    </form>
  );
}
