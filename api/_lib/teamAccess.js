import { HttpError, verifyFirebaseIdToken } from './firebaseToken.js';

/** Trimmed environment variable, or `fallback` when it's missing/empty. */
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
export const clean = (value, max = 80) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, max);

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
    throw new HttpError(502, 'Could not check your access. Please try again.');
  }
  if (response.status === 404 || response.status === 403) return false;
  if (!response.ok) throw new HttpError(502, 'Could not check your access. Please try again.');
  const { fields = {} } = await response.json();
  return ['Invited', 'Active'].includes(fields.status?.stringValue);
}

/**
 * Lets the request through only for signed-in Box Theory team members: the VITE_ADMIN_EMAILS
 * owners and everyone on the team (checked in Firestore). There is one role, so this is also the
 * admin check. Returns { email, name } or throws an HttpError (401 / 403 / 500 / 502).
 */
export async function requireTeamMember(req, deniedMessage = 'Only Box Theory team members can do this.') {
  const projectId = env('FIREBASE_PROJECT_ID', env('VITE_FIREBASE_PROJECT_ID'));
  const admins = emailList(env('ADMIN_EMAILS', env('VITE_ADMIN_EMAILS')));
  if (!projectId || !admins.length) {
    throw new HttpError(500, 'The server is missing VITE_FIREBASE_PROJECT_ID or VITE_ADMIN_EMAILS.');
  }
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const claims = await verifyFirebaseIdToken(token, { projectId });
  const email = String(claims.email ?? '').toLowerCase();
  const allowed =
    claims.email_verified === true && (admins.includes(email) || (await isTeamMember({ projectId, email, idToken: token })));
  if (!allowed) throw new HttpError(403, deniedMessage);
  return { email, name: clean(claims.name) };
}
