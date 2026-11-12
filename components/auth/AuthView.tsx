'use client';

import { useAuth, useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eyebrow } from '../Eyebrow';
import { AuthShell } from './AuthShell';
import styles from './AuthView.module.css';

type Step =
  | 'signin' // email + password, or Google
  | 'create' // name, email, password, or Google
  | 'verify-email' // 6-digit code sent after sign-up
  | 'forgot' // ask for the email to reset
  | 'reset' // code from the email + new password
  | 'device-code'; // extra email code when signing in from a new device

const AFTER = '/account';

const TITLES: Record<Step, string> = {
  signin: 'Sign in',
  create: 'Create an account',
  'verify-email': 'Check your email',
  forgot: 'Reset your password',
  reset: 'Choose a new password',
  'device-code': 'Confirm it’s you',
};

type ClerkErr = { message: string; longMessage?: string } | null;
const text = (e: ClerkErr) => (e ? (e.longMessage ?? e.message) : null);

/**
 * Sign in, sign up, email verification, password reset and Google sign-in, all inside the
 * site's own login design (portrait + red script on the left, one form at a time on the
 * right). Clerk does the work behind each form; no Clerk screens are shown.
 */
export function AuthView() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in: this page has nothing to offer.
  useEffect(() => {
    if (isSignedIn) router.replace(AFTER);
  }, [isSignedIn, router]);

  const go = (next: Step) => {
    setStep(next);
    setError(null);
    setNotice(null);
  };

  const navigate = ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    const url = decorateUrl(AFTER);
    if (url.startsWith('http')) window.location.href = url;
    else router.push(url);
  };

  /** Runs one step, showing a single clear message if it fails. */
  async function run(action: () => Promise<string | null | void>) {
    setBusy(true);
    setError(null);
    try {
      const message = await action();
      if (message) setError(message);
    } catch {
      setError('Something went wrong on our side. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  /** After any successful sign-in step: finish, or ask for the extra device code. */
  async function completeSignIn(): Promise<string | null> {
    if (signIn.status === 'complete') {
      return text((await signIn.finalize({ navigate })).error);
    }
    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const sent = await signIn.mfa.sendEmailCode();
      if (sent.error) return text(sent.error);
      go('device-code');
      setNotice(`For your security we sent a 6-digit code to ${email || 'your email'}.`);
      return null;
    }
    return 'We couldn’t finish signing you in. Please try again.';
  }

  const data = (form: HTMLFormElement) => Object.fromEntries(new FormData(form)) as Record<string, string>;

  const submit: Record<Step, (f: Record<string, string>) => Promise<string | null | void>> = {
    signin: async (f) => {
      setEmail(f.email);
      const { error } = await signIn.password({ emailAddress: f.email, password: f.password });
      return error ? text(error) : completeSignIn();
    },
    create: async (f) => {
      setEmail(f.email);
      const [firstName, ...rest] = f.name.trim().split(/\s+/);
      const { error } = await signUp.password({
        emailAddress: f.email,
        password: f.password,
        firstName,
        lastName: rest.join(' ') || undefined,
      });
      if (error) return text(error);
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) return text(sent.error);
      go('verify-email');
      setNotice(`We sent a 6-digit code to ${f.email}.`);
    },
    'verify-email': async (f) => {
      const { error } = await signUp.verifications.verifyEmailCode({ code: f.code.trim() });
      if (error) return text(error);
      if (signUp.status !== 'complete') return 'Your account needs one more detail before it can be created.';
      return text((await signUp.finalize({ navigate })).error);
    },
    forgot: async (f) => {
      setEmail(f.email);
      const created = await signIn.create({ identifier: f.email });
      if (created.error) return text(created.error);
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) return text(sent.error);
      go('reset');
      setNotice(`We sent a 6-digit code to ${f.email}.`);
    },
    reset: async (f) => {
      if (signIn.status !== 'needs_new_password') {
        const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: f.code.trim() });
        if (verified.error) return text(verified.error);
      }
      const saved = await signIn.resetPasswordEmailCode.submitPassword({
        password: f.password,
        signOutOfOtherSessions: true,
      });
      return saved.error ? text(saved.error) : completeSignIn();
    },
    'device-code': async (f) => {
      const { error } = await signIn.mfa.verifyEmailCode({ code: f.code.trim() });
      return error ? text(error) : completeSignIn();
    },
  };

  const google = () =>
    run(async () => {
      const params = {
        strategy: 'oauth_google' as const,
        redirectUrl: AFTER,
        redirectCallbackUrl: '/login/sso-callback',
      };
      const { error } = step === 'create' ? await signUp.sso(params) : await signIn.sso(params);
      return text(error);
    });

  const resend = () =>
    run(async () => {
      const { error } =
        step === 'verify-email' ? await signUp.verifications.sendEmailCode()
        : step === 'reset' ? await signIn.resetPasswordEmailCode.sendCode()
        : await signIn.mfa.sendEmailCode();
      if (error) return text(error);
      setNotice('A new code is on its way.');
    });

  const entry = step === 'signin' || step === 'create';
  const hasCode = step === 'verify-email' || step === 'reset' || step === 'device-code';
  const submitLabel: Record<Step, [string, string]> = {
    signin: ['Sign in', 'Signing in…'],
    create: ['Create account', 'Creating…'],
    'verify-email': ['Verify email', 'Verifying…'],
    forgot: ['Send reset code', 'Sending…'],
    reset: ['Save new password', 'Saving…'],
    'device-code': ['Confirm', 'Confirming…'],
  };

  return (
    <AuthShell>
          <Eyebrow>Account</Eyebrow>
          <h1 className={styles.title}>{TITLES[step]}</h1>

          {entry ? (
            <div className={styles.tabs} role="group" aria-label="Account options">
              <button type="button" className={styles.tab} aria-pressed={step === 'signin'} onClick={() => go('signin')}>
                Sign in
              </button>
              <button type="button" className={styles.tab} aria-pressed={step === 'create'} onClick={() => go('create')}>
                Create account
              </button>
            </div>
          ) : (
            <p className={styles.lede}>
              {step === 'forgot'
                ? 'Enter the email you use here and we’ll send you a code to choose a new password.'
                : notice}
            </p>
          )}

          <div key={step} className={styles.stage}>
            {entry && (
              <>
                <button type="button" className={`btn btn-outline ${styles.google}`} onClick={google} disabled={busy}>
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Continue with Google
                </button>
                <p className={styles.or}>
                  <span>or</span>
                </p>
              </>
            )}

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                const fields = data(e.currentTarget);
                run(() => submit[step](fields));
              }}
            >
              {step === 'create' && (
                <label className="field">
                  <span>Name</span>
                  <input name="name" autoComplete="name" required />
                </label>
              )}
              {(entry || step === 'forgot') && (
                <label className="field">
                  <span>Email</span>
                  <input type="email" name="email" autoComplete="email" defaultValue={email} required />
                </label>
              )}
              {hasCode && (
                <label className="field">
                  <span>6-digit code</span>
                  <input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className={styles.code}
                    required
                    autoFocus
                  />
                </label>
              )}
              {(entry || step === 'reset') && (
                <label className="field">
                  <span>{step === 'reset' ? 'New password' : 'Password'}</span>
                  <input
                    type="password"
                    name="password"
                    autoComplete={step === 'signin' ? 'current-password' : 'new-password'}
                    minLength={step === 'signin' ? undefined : 8}
                    required
                  />
                </label>
              )}
              {step === 'signin' && (
                <button type="button" className={`text-link ${styles.aside}`} onClick={() => go('forgot')}>
                  Forgot password?
                </button>
              )}
              {/* Clerk's bot check renders here when it is switched on. */}
              {step === 'create' && <div id="clerk-captcha" />}

              <button type="submit" className="btn btn-black" disabled={busy}>
                {submitLabel[step][busy ? 1 : 0]}
              </button>

              <p className={`status ${styles.status}`} role="alert">
                {error}
              </p>
            </form>

            {!entry && (
              <div className={styles.links}>
                {hasCode && (
                  <button type="button" className="text-link" onClick={resend} disabled={busy}>
                    Send a new code
                  </button>
                )}
                <button type="button" className="text-link" onClick={() => go('signin')}>
                  Back to sign in
                </button>
              </div>
            )}
          </div>
    </AuthShell>
  );
}
