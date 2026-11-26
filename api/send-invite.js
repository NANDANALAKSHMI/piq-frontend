import nodemailer from 'nodemailer';
import { HttpError } from './_lib/firebaseToken.js';
import { clean, env, readBody, requireAdmin } from './_lib/auth.js';
import { buildInviteEmail } from './_lib/inviteEmail.js';

/**
 * POST /api/send-invite — emails a Box Theory team invitation from the Snap Infinity mailbox.
 * Only signed-in Box Theory admins can call it (Firebase ID token in the Authorization header).
 * There is one role: the VITE_ADMIN_EMAILS owners and everyone on the team (checked in Firestore).
 *
 * Environment (Vercel → Settings → Environment Variables, or .env.local for `npm run dev`):
 *   SMTP_USER, SMTP_PASS        Snap Infinity Gmail address + a Google App Password (required)
 *   APP_URL                     Public site URL used in the "Accept invitation" link (optional)
 *   SMTP_HOST, SMTP_PORT        Optional, default smtp.gmail.com / 465
 *   MAIL_FROM_NAME              Optional sender name, default "Box Theory"
 * It reuses VITE_FIREBASE_PROJECT_ID and VITE_ADMIN_EMAILS (or FIREBASE_PROJECT_ID / ADMIN_EMAILS).
 */

const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

/** Site the invitation link points to: APP_URL, else the site the admin is using. */
function appUrl(req) {
  const configured = env('APP_URL');
  if (configured) return configured.replace(/\/+$/, '');
  const { origin } = req.headers;
  if (typeof origin === 'string' && /^https?:\/\/[^\s/]+$/i.test(origin)) return origin;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0];
  return `${proto}://${host}`;
}

function createMailer() {
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS').replace(/\s+/g, ''); // Google shows App Passwords in groups of four
  const missing = [!user && 'SMTP_USER', !pass && 'SMTP_PASS'].filter(Boolean);
  if (missing.length) {
    throw new HttpError(
      500,
      `Invitation email isn't set up on the server: ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing. ` +
        'Add it in Vercel → Settings → Environment Variables (Production), then redeploy.',
    );
  }
  const port = Number(env('SMTP_PORT', '465'));
  const transport = nodemailer.createTransport({
    host: env('SMTP_HOST', 'smtp.gmail.com'),
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return { user, transport };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Use POST.' });
  }

  try {
    const inviter = await requireAdmin(req);
    const body = readBody(req);
    const email = clean(body.email, 254).toLowerCase();
    const name = clean(body.name);
    const title = clean(body.title);
    if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    if (!name) throw new HttpError(400, 'Add the person’s name.');

    const { user, transport } = createMailer();
    const inviteUrl = `${appUrl(req)}/login?invite=${encodeURIComponent(email)}`;
    const message = buildInviteEmail({ name, email, title, inviterName: inviter.name, inviteUrl });

    const info = await transport.sendMail({
      from: { name: env('MAIL_FROM_NAME', 'Box Theory'), address: user },
      to: { name, address: email },
      replyTo: inviter.email,
      ...message,
    });
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ ok: false, error: error.message });
    console.error('[send-invite]', error);
    const message =
      error?.code === 'EAUTH'
        ? 'Gmail refused the login. SMTP_PASS must be a Google App Password for the Snap Infinity mailbox.'
        : 'The invitation email could not be sent. Please try again.';
    return res.status(502).json({ ok: false, error: message });
  }
}
