import 'server-only';

/**
 * Keeps the newsletter list in Brevo in step with our own subscriber table. Does nothing
 * until BREVO_API_KEY and BREVO_LIST_ID are set; our table stays the record either way.
 */
export const brevoConfigured = !!process.env.BREVO_API_KEY && !!process.env.BREVO_LIST_ID;

export async function syncBrevoContact(email: string, subscribed: boolean): Promise<boolean> {
  if (!brevoConfigured) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        subscribed
          ? { email, listIds: [Number(process.env.BREVO_LIST_ID)], emailBlacklisted: false, updateEnabled: true }
          : { email, unlinkListIds: [Number(process.env.BREVO_LIST_ID)], emailBlacklisted: true, updateEnabled: true },
      ),
    });
    return res.ok;
  } catch {
    return false;
  }
}
