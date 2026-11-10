import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, createGoogleProvider, isFirebaseConfigured } from '../lib/firebase.js';
import { ADMIN_EMAILS, memberId, normaliseEmail } from '../lib/memberUtils.js';

const AuthContext = createContext(null);

// Forget any session left over from the old demo login (sample accounts).
try {
  window.localStorage.removeItem('piq-session');
} catch {
  // Storage can be unavailable (private mode) — nothing to clean up then.
}

const ADMIN_HINT = ADMIN_EMAILS.length
  ? ''
  : ' (No admin email loaded — set VITE_ADMIN_EMAILS in .env.local and restart npm run dev.)';

const NOT_CONFIGURED = { ok: false, error: 'Firebase is not configured. Add your keys to .env.local.' };

/** Plain-language messages for Firebase Authentication errors. */
const AUTH_ERRORS = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/email-already-in-use': 'This email already has an account. Sign in instead, or use “Forgot password?”.',
  'auth/user-disabled': 'This account has been disabled. Contact an administrator.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not turned on in Firebase yet (Authentication → Sign-in method).',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in. Add it in Firebase → Authentication → Settings.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};
const authError = (err, fallback) => ({ ok: false, error: AUTH_ERRORS[err?.code] ?? fallback });

/** Confirmation and reset emails bring people back to the sign-in page. */
async function withReturnLink(send) {
  try {
    await send({ url: `${window.location.origin}/login` });
  } catch (err) {
    // The site isn't in Firebase's authorised domains: send the email without the return link.
    if (err?.code === 'auth/unauthorized-continue-uri' || err?.code === 'auth/invalid-continue-uri') await send(undefined);
    else throw err;
  }
}

/** "Keep me signed in": remember the session in this browser, or only for this tab. */
const persist = (remember) => setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

/** Firestore errors worth a quick retry (connection still starting, brief network hiccup). */
const TEMPORARY = new Set(['unavailable', 'deadline-exceeded', 'internal', 'unknown', 'aborted']);

async function withRetries(task, attempts = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      if (attempt >= attempts || !TEMPORARY.has(err?.code)) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }
}

/** Turn a signed-in Firebase user into the Box Theory user. `member` is their invitation record (null for owners). */
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
    provider: firebaseUser.providerData[0]?.providerId ?? 'password',
  };
}

/**
 * Decides whether a signed-in account may use Box Theory: owners by email (VITE_ADMIN_EMAILS),
 * everyone else only after an admin has invited them from the Team page (Firestore `members`).
 * Password accounts must confirm their email first (Google accounts already are confirmed).
 */
async function resolveAccess(firebaseUser) {
  const email = normaliseEmail(firebaseUser.email ?? '');

  if (!firebaseUser.emailVerified) {
    // They may have just clicked the link in the confirmation email: check again.
    await reload(firebaseUser).catch(() => {});
    if (firebaseUser.emailVerified) await firebaseUser.getIdToken(true).catch(() => {});
  }
  if (!firebaseUser.emailVerified) {
    return { ok: false, needsVerification: true, error: `Confirm your email first — open the link we sent to ${email}.` };
  }

  if (ADMIN_EMAILS.includes(email)) return { ok: true, user: toAppUser(firebaseUser, null) };

  const denied = `${email || 'This account'} does not have access to Box Theory. Ask an admin to send you an invitation.${ADMIN_HINT}`;
  if (!isFirebaseConfigured || !email) return { ok: false, error: denied };

  let membersApi;
  try {
    membersApi = await import('../lib/members.js'); // Firestore loads only when it's needed
  } catch (err) {
    console.warn('[auth] Could not load the team module', err);
    return { ok: false, error: 'Box Theory was just updated. Reload the page and sign in again.' };
  }

  let member;
  try {
    member = await withRetries(() => membersApi.getMemberRecord(email));
  } catch (err) {
    console.warn('[auth] Could not read the invitation', err);
    const error =
      err?.code === 'permission-denied'
        ? 'Firestore refused to read your invitation. An admin needs to publish the latest firestore.rules.'
        : `Could not check your invitation right now (${err?.code ?? err?.message ?? 'network error'}). Please try again in a moment.`;
    return { ok: false, error };
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

export function AuthProvider({ children }) {
  const [signedInUser, setSignedInUser] = useState(null);
  /** Email of a password account that still has to confirm its email address. */
  const [pendingVerification, setPendingVerification] = useState(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  // One access check per signed-in account, shared by the sign-in calls and the auth listener.
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

  /** Applies an access decision: let them in, wait for the email confirmation, or sign them out. */
  const applyAccess = useCallback(async (firebaseUser, result) => {
    if (result.ok) {
      setPendingVerification(null);
      setSignedInUser(result.user);
      return { ok: true };
    }
    setSignedInUser(null);
    if (result.needsVerification) {
      setPendingVerification(normaliseEmail(firebaseUser.email ?? ''));
      return result;
    }
    setPendingVerification(null);
    await signOut(auth).catch(() => {});
    return result;
  }, []);

  // Keep the session in sync with Firebase (restores it after a refresh).
  useEffect(() => {
    if (!auth) return undefined;
    let latestRun = 0;
    return onAuthStateChanged(auth, async (fbUser) => {
      const run = (latestRun += 1);
      if (!fbUser) {
        accessChecks.current.clear();
        setSignedInUser(null);
        setPendingVerification(null);
        setAuthReady(true);
        return;
      }
      const result = await checkAccess(fbUser);
      if (run !== latestRun) return; // a newer sign-in/out happened meanwhile
      await applyAccess(fbUser, result);
      setAuthReady(true);
    });
  }, [applyAccess, checkAccess]);

  /** Email + password sign-in. */
  const loginWithPassword = useCallback(
    async ({ email, password, remember = true }) => {
      if (!auth) return NOT_CONFIGURED;
      try {
        await persist(remember);
        const { user: fbUser } = await signInWithEmailAndPassword(auth, normaliseEmail(email), password);
        return applyAccess(fbUser, await checkAccess(fbUser));
      } catch (err) {
        return authError(err, 'Sign-in failed. Please try again.');
      }
    },
    [applyAccess, checkAccess],
  );

  /** First visit from an invitation: create the password, then confirm the email address. */
  const createAccount = useCallback(
    async ({ email, password, remember = true }) => {
      if (!auth) return NOT_CONFIGURED;
      try {
        await persist(remember);
        const { user: fbUser } = await createUserWithEmailAndPassword(auth, normaliseEmail(email), password);
        await withReturnLink((settings) => sendEmailVerification(fbUser, settings)).catch((err) =>
          console.warn('[auth] Could not send the confirmation email', err),
        );
        return applyAccess(fbUser, await checkAccess(fbUser));
      } catch (err) {
        return authError(err, 'Could not create your account. Please try again.');
      }
    },
    [applyAccess, checkAccess],
  );

  /** Google sign-in. `loginHint` pre-selects the invited account. */
  const loginWithGoogle = useCallback(
    async ({ remember = true, loginHint } = {}) => {
      if (!auth) return NOT_CONFIGURED;
      try {
        await persist(remember);
        const { user: fbUser } = await signInWithPopup(auth, createGoogleProvider(loginHint));
        return applyAccess(fbUser, await checkAccess(fbUser));
      } catch (err) {
        return authError(err, 'Google sign-in failed. Please try again.');
      }
    },
    [applyAccess, checkAccess],
  );

  /** Sends the "confirm your email" message again. */
  const resendVerification = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return { ok: false, error: 'Sign in again to get a new confirmation email.' };
    try {
      await withReturnLink((settings) => sendEmailVerification(current, settings));
      return { ok: true };
    } catch (err) {
      return authError(err, 'Could not send the email. Please try again.');
    }
  }, []);

  /** After clicking the link in the confirmation email: check again and continue. */
  const confirmVerified = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return { ok: false, error: 'Sign in again to continue.' };
    try {
      await reload(current);
      if (!current.emailVerified) {
        return { ok: false, needsVerification: true, error: 'Not confirmed yet — open the link in the email we sent, then try again.' };
      }
      await current.getIdToken(true); // the new token tells Firestore the email is confirmed
      accessChecks.current.delete(current.uid);
      return applyAccess(current, await checkAccess(current));
    } catch (err) {
      return authError(err, 'Could not check your email right now. Please try again.');
    }
  }, [applyAccess, checkAccess]);

  /** "Forgot password?": Firebase emails a reset link (and says nothing if there's no such account). */
  const resetPassword = useCallback(async (email) => {
    if (!auth) return NOT_CONFIGURED;
    try {
      await withReturnLink((settings) => sendPasswordResetEmail(auth, normaliseEmail(email), settings));
      return { ok: true };
    } catch (err) {
      return authError(err, 'Could not send the reset email. Please try again.');
    }
  }, []);

  const logout = useCallback(() => {
    setSignedInUser(null);
    setPendingVerification(null);
    accessChecks.current.clear();
    if (auth) signOut(auth).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      user: signedInUser,
      authReady,
      pendingVerification,
      loginWithPassword,
      createAccount,
      loginWithGoogle,
      resendVerification,
      confirmVerified,
      resetPassword,
      logout,
    }),
    [signedInUser, authReady, pendingVerification, loginWithPassword, createAccount, loginWithGoogle, resendVerification, confirmVerified, resetPassword, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
