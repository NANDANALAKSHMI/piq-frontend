import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { teamMembers } from '../data/teamData.js';
import { auth, createGoogleProvider, isFirebaseConfigured } from '../lib/firebase.js';
import { ADMIN_EMAILS, memberId, normaliseEmail } from '../lib/memberUtils.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'piq-session';

function readStoredUserId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUserId(id) {
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session just won't persist.
  }
}

const ADMIN_HINT = ADMIN_EMAILS.length
  ? ''
  : ' (No admin email loaded — set VITE_ADMIN_EMAILS in .env.local and restart npm run dev.)';

/** Turn a signed-in Google user into the Box Theory user. `member` is their invitation record (null for admins). */
function toAppUser(firebaseUser, member) {
  const email = normaliseEmail(firebaseUser.email ?? '');
  return {
    id: memberId(email),
    name: firebaseUser.displayName || member?.name || email,
    email,
    phone: firebaseUser.phoneNumber || member?.phone || '',
    role: 'Admin', // one role: everyone on the team has full access
    title: member?.title || 'Administrator',
    status: 'Active',
    color: 'bg-brand-ink',
    photoURL: firebaseUser.photoURL,
    provider: 'google',
  };
}

/**
 * Decides whether a Google account may use Box Theory: admins by email (VITE_ADMIN_EMAILS),
 * everyone else only after an admin has invited them from the Team page (Firestore `members`).
 * There is one role: everyone on the team has full admin access.
 */
async function resolveAccess(firebaseUser) {
  const email = normaliseEmail(firebaseUser.email ?? '');
  if (ADMIN_EMAILS.includes(email)) return { ok: true, user: toAppUser(firebaseUser, null) };

  const denied = `${email || 'This Google account'} does not have access to Box Theory. Ask an admin to send you an invitation.${ADMIN_HINT}`;
  if (!isFirebaseConfigured || !email) return { ok: false, error: denied };

  let membersApi;
  let member;
  try {
    membersApi = await import('../lib/members.js'); // Firestore loads only when it's needed
    member = await membersApi.getMemberRecord(email);
  } catch (err) {
    console.warn('[auth] Could not read the invitation — is Firestore created and firestore.rules published?', err);
    return { ok: false, error: 'Could not check your invitation right now. Please try again in a moment.' };
  }
  if (!member) return { ok: false, error: denied };
  if (member.status === 'Inactive') {
    return { ok: false, error: 'Your Box Theory access has been switched off. Contact an administrator.' };
  }

  // The first sign-in accepts the invitation; later ones just refresh "last signed in".
  membersApi.recordSignIn(email, firebaseUser.uid, member.status === 'Invited').catch((err) =>
    console.warn('[auth] Could not update the member record', err),
  );
  return { ok: true, user: toAppUser(firebaseUser, member) };
}

const GOOGLE_ERRORS = {
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in. Add it in Firebase → Authentication → Settings.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase yet.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(readStoredUserId);
  const [googleUser, setGoogleUser] = useState(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  // One access check per signed-in account, shared by the popup flow and the auth listener.
  const accessChecks = useRef(new Map());

  const checkAccess = useCallback((firebaseUser) => {
    const pending = accessChecks.current.get(firebaseUser.uid);
    if (pending) return pending;
    const check = resolveAccess(firebaseUser).then((result) => {
      if (!result.ok) accessChecks.current.delete(firebaseUser.uid);
      return result;
    });
    accessChecks.current.set(firebaseUser.uid, check);
    return check;
  }, []);

  // Keep the Google session in sync with Firebase (restores it after a refresh).
  useEffect(() => {
    if (!auth) return undefined;
    let latestRun = 0;
    return onAuthStateChanged(auth, async (fbUser) => {
      const run = (latestRun += 1);
      if (!fbUser) {
        accessChecks.current.clear();
        setGoogleUser(null);
        setAuthReady(true);
        return;
      }
      const result = await checkAccess(fbUser);
      if (run !== latestRun) return; // a newer sign-in/out happened meanwhile
      if (result.ok) {
        setGoogleUser(result.user);
      } else {
        setGoogleUser(null);
        signOut(auth).catch(() => {});
      }
      setAuthReady(true);
    });
  }, [checkAccess]);

  const demoUser = useMemo(() => teamMembers.find((member) => member.id === userId) ?? null, [userId]);
  const user = googleUser ?? demoUser;

  /** Demo login: any active team member's email or phone with a password of 6+ characters. */
  const login = useCallback(({ identifier, password, remember }) => {
    const value = identifier.trim().toLowerCase();
    const member = teamMembers.find(
      (m) => m.email.toLowerCase() === value || m.phone.replace(/\s/g, '') === value.replace(/\s/g, ''),
    );
    if (!member) return { ok: false, error: 'No Box Theory account found for that email or mobile number.' };
    if (member.status !== 'Active') return { ok: false, error: 'This account has not been activated yet.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    setUserId(member.id);
    writeStoredUserId(remember ? member.id : null);
    return { ok: true };
  }, []);

  /** Google sign-in through Firebase Authentication. `loginHint` pre-selects the invited account. */
  const loginWithGoogle = useCallback(
    async ({ remember = true, loginHint } = {}) => {
      if (!auth) return { ok: false, error: 'Firebase is not configured. Add your keys to .env.local.' };
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const result = await signInWithPopup(auth, createGoogleProvider(loginHint));
        const access = await checkAccess(result.user);
        if (!access.ok) {
          await signOut(auth).catch(() => {});
          return { ok: false, error: access.error };
        }
        setGoogleUser(access.user);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: GOOGLE_ERRORS[err?.code] ?? 'Google sign-in failed. Please try again.' };
      }
    },
    [checkAccess],
  );

  const logout = useCallback(() => {
    setUserId(null);
    writeStoredUserId(null);
    setGoogleUser(null);
    accessChecks.current.clear();
    if (auth) signOut(auth).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ user, authReady, login, loginWithGoogle, logout }),
    [user, authReady, login, loginWithGoogle, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
