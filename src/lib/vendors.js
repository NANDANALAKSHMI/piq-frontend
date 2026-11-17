import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firestore.js';
import { VENDOR_STATUSES } from '../features/vendors/vendorStatus.js';

/**
 * Vendors live in the Firestore `vendors` collection — one document per vendor. A vendor's
 * categories are services from the Services page (`serviceIds`) and the services it offers are
 * their sub-services (`subServiceIds`), so a rename there shows up everywhere straight away.
 * Anyone on the team can manage them (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const VENDORS = 'vendors';

const STATUS_VALUES = VENDOR_STATUSES.map((s) => s.value);

const vendorRef = (id) => doc(db, VENDORS, id);
const toDate = (value) => (typeof value?.toDate === 'function' ? value.toDate() : null);
const ids = (value) => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);

/** Firestore document → the vendor shape the rest of the app uses. */
function toVendor(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    contactPerson: data.contactPerson ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    state: data.state ?? '',
    district: data.district ?? '',
    city: data.city ?? '',
    address: data.address ?? '',
    serviceIds: ids(data.serviceIds),
    subServiceIds: ids(data.subServiceIds),
    status: STATUS_VALUES.includes(data.status) ? data.status : 'Approved',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Live list of vendors, A–Z. */
export function subscribeToVendors(onChange, onError) {
  return onSnapshot(
    collection(db, VENDORS),
    (snapshot) => onChange(snapshot.docs.map(toVendor).sort((a, b) => a.name.localeCompare(b.name))),
    onError,
  );
}

/** Saves a new vendor and resolves to its id. */
export async function createVendor(draft, createdBy) {
  const ref = doc(collection(db, VENDORS));
  await setDoc(ref, { ...draft, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export function updateVendor(id, changes) {
  return updateDoc(vendorRef(id), { ...changes, updatedAt: serverTimestamp() });
}

export function deleteVendor(id) {
  return deleteDoc(vendorRef(id));
}
