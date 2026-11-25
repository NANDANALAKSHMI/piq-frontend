import { HttpError, verifyFirebaseIdToken } from './firebaseToken.js';

/** Reads a server environment variable (trimmed), falling back to `fallback` when empty. */
export function env(name, fallback = '') {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

const emailList = (value) =>
  value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

/** Single-line, length-limited text (keeps header injection and huge payloads out). */
export function clean(value, max = 80) {
  return String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Is this person on the team (invited from the Team page and not switched off)? Reads their own
 * Firestore member record through the REST API with their ID token, so the normal security rules
 * apply (no service account needed).
 */
async function isTeamMember({ projectId, email, idToken }) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/members/${encodeURIComponent(email)}`;
  let response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, signal: AbortSignal.timeout(8000) });
  } catch {
    throw new HttpError(502, 'Could not check your admin access. Please try again.');
  }
  if (response.status === 404 || response.status === 403) return false;
  if (!response.ok) throw new HttpError(502, 'Could not check your admin access. Please try again.');
  const { fields = {} } = await response.json();
  return ['Invited', 'Active'].includes(fields.status?.stringValue);
}

/**
 * Only signed-in Box Theory people may call an API route: the VITE_ADMIN_EMAILS owners and everyone
 * on the team. `action` finishes the sentence "Only Box Theory admins can …" in the 403 message.
 */
export async function requireAdmin(req, action = 'send invitations') {
  const projectId = env('FIREBASE_PROJECT_ID', env('VITE_FIREBASE_PROJECT_ID'));
  const admins = emailList(env('ADMIN_EMAILS', env('VITE_ADMIN_EMAILS')));
  if (!projectId || !admins.length) {
    throw new HttpError(500, 'The server is missing VITE_FIREBASE_PROJECT_ID or VITE_ADMIN_EMAILS.');
  }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const claims = await verifyFirebaseIdToken(token, { projectId });
  const email = String(claims.email ?? '').toLowerCase();
  const isAdmin =
    claims.email_verified === true && (admins.includes(email) || (await isTeamMember({ projectId, email, idToken: token })));
  if (!isAdmin) throw new HttpError(403, `Only Box Theory admins can ${action}.`);
  return { email, name: clean(claims.name) };
}

/** Parses a JSON request body (Vercel gives an object or a string). */
export function readBody(req) {
  try {
    const { body } = req;
    if (typeof body === 'string') return body ? JSON.parse(body) : {};
    return body ?? {};
  } catch {
    throw new HttpError(400, 'The request body must be JSON.');
  }
}
