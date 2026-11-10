/**
 * Small helpers for team members and invitations. Kept apart from members.js so pages can use
 * them without pulling the Firestore SDK into the first page load.
 */
export const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

export function normaliseEmail(email = '') {
  return String(email).trim().toLowerCase();
}

/** Google accounts with full admin access (comma-separated in VITE_ADMIN_EMAILS). */
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => normaliseEmail(email))
  .filter(Boolean);

/** Stable id for a real team member — the same for their Team row and their signed-in user. */
export const memberId = (email) => `member:${normaliseEmail(email)}`;

/** Plain-language message for Firestore errors (almost always a setup step that's missing). */
export function describeFirestoreError(error) {
  switch (error?.code) {
    case 'permission-denied':
      return 'Firestore refused the request. Publish firestore.rules and check your email is in its admin list.';
    case 'not-found':
    case 'failed-precondition':
      return 'Firestore is not set up yet. Create the Firestore database in the Firebase console.';
    case 'unavailable':
      return 'Cannot reach Firestore. Check your connection, and that the Firestore database has been created in the Firebase console.';
    default:
      return error?.message || 'Something went wrong while saving. Please try again.';
  }
}
