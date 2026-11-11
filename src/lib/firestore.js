import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseApp } from './firebase.js';

/**
 * Firestore with long-polling, which avoids the slow or stuck first load that some networks, VPNs
 * and antivirus tools cause with Firestore's default streaming connection. Each tab keeps its own
 * in-memory cache (a cache shared between tabs broke sign-in when several tabs were open).
 *
 * Shared by every module that talks to Firestore (members.js, services.js). Import it only from
 * modules that are themselves loaded on demand, so the SDK stays out of the first page load.
 */
function createDb() {
  if (!firebaseApp) return null;
  try {
    return initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(firebaseApp); // already set up (e.g. after a hot reload in dev)
  }
}

export const db = createDb();
