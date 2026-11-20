import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firestore.js';

/**
 * Clients live in the Firestore `clients` collection — one document per client, with its
 * locations kept as an array on the document. Anyone on the team can manage them
 * (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const CLIENTS = 'clients';

const clientRef = (id) => doc(db, CLIENTS, id);

function toLocation(raw) {
  return {
    id: raw.id,
    name: raw.name ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    state: raw.state ?? '',
    district: raw.district ?? '',
    pin: raw.pin ?? '',
    maps: raw.maps ?? '',
    primary: raw.primary === true,
  };
}

/** Firestore document → the client shape the rest of the app uses. */
function toClient(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    industry: data.industry ?? '',
    contactName: data.contactName ?? '',
    designation: data.designation ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    gstin: data.gstin ?? '',
    type: data.type ?? 'Regular / contract',
    notes: data.notes ?? '',
    since: data.since ?? '',
    locations: Array.isArray(data.locations) ? data.locations.filter((l) => l?.id).map(toLocation) : [],
    updatedAt: typeof data.updatedAt?.toDate === 'function' ? data.updatedAt.toDate() : null,
  };
}

/** Live list of clients, A–Z. */
export function subscribeToClients(onChange, onError) {
  return onSnapshot(
    collection(db, CLIENTS),
    (snapshot) => onChange(snapshot.docs.map(toClient).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

/** Saves a new client and resolves to its id. */
export async function createClient(draft, createdBy) {
  const ref = doc(collection(db, CLIENTS));
  await setDoc(ref, { ...draft, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

/** Saves changes to a client. Pass `locations` (the whole array) to change its locations. */
export function updateClient(id, changes) {
  return updateDoc(clientRef(id), { ...changes, updatedAt: serverTimestamp() });
}
