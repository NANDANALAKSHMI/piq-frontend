import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firestore.js';

/**
 * The services Box Theory offers live in the Firestore `services` collection — one document per
 * service, with its sub-services kept as an array on the document. Anyone on the team can manage
 * them (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const SERVICES = 'services';

const serviceRef = (id) => doc(db, SERVICES, id);

function toSubService(raw) {
  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? '',
    active: raw.active !== false,
  };
}

/** Firestore document → the service shape the Services page uses. */
function toService(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    description: data.description ?? '',
    ownerRole: data.ownerRole ?? '',
    active: data.active !== false,
    order: data.order ?? 0,
    subServices: Array.isArray(data.subServices) ? data.subServices.filter((s) => s?.id).map(toSubService) : [],
  };
}

const byOrder = (a, b) => a.order - b.order || a.name.localeCompare(b.name);

/** Live list of services, in the order they were added. */
export function subscribeToServices(onChange, onError) {
  return onSnapshot(collection(db, SERVICES), (snapshot) => onChange(snapshot.docs.map(toService).sort(byOrder)), onError);
}

/** Adds a service and resolves to its new id. */
export async function createService({ name, description = '', ownerRole = '' }) {
  const ref = doc(collection(db, SERVICES));
  await setDoc(ref, {
    name: name.trim(),
    description: description.trim(),
    ownerRole: ownerRole.trim(),
    active: true,
    order: Date.now(),
    subServices: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Saves changes to a service. Pass `subServices` (the whole array) to change its sub-services. */
export function updateService(id, changes) {
  return updateDoc(serviceRef(id), { ...changes, updatedAt: serverTimestamp() });
}

/** Removes a service together with its sub-services. */
export function deleteService(id) {
  return deleteDoc(serviceRef(id));
}
