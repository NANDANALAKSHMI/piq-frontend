import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { teamMembers } from '../data/teamData.js';

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

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(readStoredUserId);

  const user = useMemo(() => teamMembers.find((member) => member.id === userId) ?? null, [userId]);

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

  const logout = useCallback(() => {
    setUserId(null);
    writeStoredUserId(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
