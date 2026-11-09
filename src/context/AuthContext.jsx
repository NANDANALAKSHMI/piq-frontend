import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { teamMembers } from '../data/teamData.js';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase.js';

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

/** Google accounts allowed into PIQ (comma-separated in VITE_ADMIN_EMAILS). Everyone else is turned away. */
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAllowed(firebaseUser) {
  return ADMIN_EMAILS.includes((firebaseUser?.email ?? '').toLowerCase());
}

/** Turn an allowed Firebase user into the PIQ admin user. */
function toPiqUser(firebaseUser) {
  const email = (firebaseUser.email ?? '').toLowerCase();
  return {
    id: `google:${firebaseUser.uid}`,
    name: firebaseUser.displayName || email,
    email,
    phone: firebaseUser.phoneNumber ?? '',
    role: 'Admin',
    title: 'Administrator',
    status: 'Active',
    color: 'bg-brand-ink',
    photoURL: firebaseUser.photoURL,
    provider: 'google',
  };
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

  // Keep the Google session in sync with Firebase (restores it after a refresh).
  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && !isAllowed(fbUser)) {
        signOut(auth).catch(() => {});
        setGoogleUser(null);
      } else {
        setGoogleUser(fbUser ? toPiqUser(fbUser) : null);
      }
      setAuthReady(true);
    });
  }, []);

  const demoUser = useMemo(() => teamMembers.find((member) => member.id === userId) ?? null, [userId]);
  const user = googleUser ?? demoUser;

  /** Demo login: any active team member's email or phone with a password of 6+ characters. */
  const login = useCallback(({ identifier, password, remember }) => {
    const value = identifier.trim().toLowerCase();
    const member = teamMembers.find(
      (m) => m.email.toLowerCase() === value || m.phone.replace(/\s/g, '') === value.replace(/\s/g, ''),
    );
    if (!member) return { ok: false, error: 'No PIQ account found for that email or mobile number.' };
    if (member.status !== 'Active') return { ok: false, error: 'This account has not been activated yet.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    setUserId(member.id);
    writeStoredUserId(remember ? member.id : null);
    return { ok: true };
  }, []);

  /** Google sign-in through Firebase Authentication. */
  const loginWithGoogle = useCallback(async ({ remember = true } = {}) => {
    if (!auth) return { ok: false, error: 'Firebase is not configured. Add your keys to .env.local.' };
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      if (!isAllowed(result.user)) {
        const tried = result.user.email ?? 'This Google account';
        await signOut(auth);
        const hint = ADMIN_EMAILS.length
          ? ''
          : ' (No admin email loaded — set VITE_ADMIN_EMAILS in .env.local and restart npm run dev.)';
        return { ok: false, error: `${tried} does not have access to PIQ.${hint}` };
      }
      setGoogleUser(toPiqUser(result.user));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: GOOGLE_ERRORS[err?.code] ?? 'Google sign-in failed. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    writeStoredUserId(null);
    setGoogleUser(null);
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
