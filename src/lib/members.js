import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  increment,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, firebaseApp } from './firebase.js';
import { memberId, normaliseEmail } from './memberUtils.js';

/**
 * Team invitations live in the Firestore `members` collection — one document per person,
 * keyed by their lower-case email. Admins manage the collection; an invited person can only
 * read and accept their own record (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const MEMBERS = 'members';

/**
 * Firestore set up for a fast Team page:
 * - an on-device cache (IndexedDB, shared by all tabs), so after the first visit the team shows
 *   instantly while fresh data loads in the background;
 * - long-polling, which avoids the slow or stuck first load that some networks, VPNs and antivirus
 *   tools cause with Firestore's default streaming connection.
 */
function createDb() {
  if (!firebaseApp) return null;
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(firebaseApp); // already set up (e.g. after a hot reload in dev)
  }
}
const db = createDb();

const memberRef = (email) => doc(db, MEMBERS, normaliseEmail(email));

const AVATAR_COLORS = ['bg-blue-700', 'bg-pink-700', 'bg-green-700', 'bg-violet-700', 'bg-teal-700', 'bg-rose-700', 'bg-indigo-700', 'bg-slate-600'];

function avatarColor(email) {
  let hash = 0;
  for (const char of email) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const toDate = (value) => (typeof value?.toDate === 'function' ? value.toDate() : null);

/** Firestore document → the member shape the rest of the app already uses. */
function toMember(snapshot) {
  const data = snapshot.data();
  const email = data.email ?? snapshot.id;
  return {
    id: memberId(email),
    source: 'invite',
    name: data.name || email,
    email,
    phone: data.phone ?? '',
    title: data.title || '',
    role: 'Admin', // one role: everyone on the team has full access
    status: data.status || 'Invited',
    color: avatarColor(email),
    lastActive: '—',
    invitedAt: toDate(data.invitedAt),
    acceptedAt: toDate(data.acceptedAt),
    lastSignInAt: toDate(data.lastSignInAt),
    lastInviteSentAt: toDate(data.lastInviteSentAt),
    inviteCount: data.inviteCount ?? 0,
  };
}

/** Live team list. Admins and team members can read it; the security rules refuse everyone else. */
export function subscribeToMembers(onChange, onError) {
  return onSnapshot(collection(db, MEMBERS), (snapshot) => onChange(snapshot.docs.map(toMember)), onError);
}

/** The signed-in person's own record, or null if they were never invited. */
export async function getMemberRecord(email) {
  const snapshot = await getDoc(memberRef(email));
  return snapshot.exists() ? snapshot.data() : null;
}

/** Runs on every Google sign-in; the first one turns an invitation into an active member. */
export function recordSignIn(email, uid, acceptingInvite) {
  return updateDoc(memberRef(email), {
    ...(acceptingInvite ? { status: 'Active', acceptedAt: serverTimestamp() } : {}),
    uid,
    lastSignInAt: serverTimestamp(),
  });
}

/** Saves a new invitation (status "Invited"). Throws if the email is already on the team. */
export async function createInvite(draft, invitedBy) {
  const email = normaliseEmail(draft.email);
  const ref = memberRef(email);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().status !== 'Inactive') {
    throw Object.assign(new Error(`${email} is already on the team.`), { code: 'already-member' });
  }
  await setDoc(ref, {
    email,
    name: draft.name.trim(),
    title: draft.title?.trim() ?? '',
    phone: draft.phone?.trim() ?? '',
    role: 'Admin',
    status: 'Invited',
    invitedBy: normaliseEmail(invitedBy),
    invitedAt: serverTimestamp(),
    inviteCount: 0,
  });
  return email;
}

export function setMemberStatus(email, status) {
  return updateDoc(memberRef(email), { status });
}

/** Cancels a pending invitation (e.g. a mistyped email) — the invite link stops working. */
export function deleteInvite(email) {
  return deleteDoc(memberRef(email));
}

/** Asks the server (/api/send-invite) to email the invitation from the Snap Infinity mailbox. */
export async function sendInviteEmail({ email, name, title }) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('Sign in with Google to send invitations.');
  const token = await currentUser.getIdToken();

  let response;
  try {
    response = await fetch('/api/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: normaliseEmail(email), name, title }),
    });
  } catch {
    throw new Error('Could not reach the email service. Check your connection and try again.');
  }

  const result = await response.json().catch(() => null);
  if (!result) throw new Error('The invitation email service is not available here. Restart npm run dev or deploy to Vercel.');
  if (!response.ok || !result.ok) throw new Error(result.error ?? `The email service failed (${response.status}).`);

  // Bookkeeping only — the email is already on its way even if this write fails.
  await updateDoc(memberRef(email), { lastInviteSentAt: serverTimestamp(), inviteCount: increment(1) }).catch(() => {});
  return result;
}
