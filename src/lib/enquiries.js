import { collection, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firestore.js';

/**
 * Enquiries live in the Firestore `enquiries` collection — one document per enquiry, keyed by
 * its number (ENQ-001, ENQ-002…), with follow-ups kept as an array on the document. Anyone on
 * the team can manage them (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const ENQUIRIES = 'enquiries';
const ID_PREFIX = 'ENQ-';

const enquiryRef = (id) => doc(db, ENQUIRIES, id);
const numberOf = (id) => Number(String(id).replace(/\D/g, '')) || 0;

/** Firestore document → the enquiry shape the rest of the app already uses. */
function toEnquiry(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    company: data.company ?? '',
    contactName: data.contactName ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    state: data.state ?? '',
    city: data.city ?? '',
    location: data.location ?? '',
    source: data.source ?? '',
    services: Array.isArray(data.services) ? data.services : [],
    scope: data.scope ?? 'Custom',
    status: data.status ?? 'New',
    receivedOn: data.receivedOn ?? '',
    assignedTo: data.assignedTo ?? null,
    notes: data.notes ?? '',
    followUps: Array.isArray(data.followUps) ? data.followUps : [],
  };
}

/** Live list of enquiries, newest first. */
export function subscribeToEnquiries(onChange, onError) {
  return onSnapshot(
    collection(db, ENQUIRIES),
    (snapshot) => onChange(snapshot.docs.map(toEnquiry).sort((a, b) => numberOf(b.id) - numberOf(a.id))),
    onError,
  );
}

/**
 * Saves a new enquiry under the next free number and resolves to that id. The number is claimed
 * in a transaction, so two people saving at the same moment can't end up with the same one.
 */
export async function createEnquiry(draft, existingIds, createdBy) {
  let number = existingIds.reduce((highest, id) => Math.max(highest, numberOf(id)), 0) + 1;
  for (let attempt = 0; attempt < 25; attempt += 1, number += 1) {
    const id = `${ID_PREFIX}${String(number).padStart(3, '0')}`;
    const ref = enquiryRef(id);
    const created = await runTransaction(db, async (transaction) => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, { ...draft, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return true;
    });
    if (created) return id;
  }
  throw new Error('Could not find a free enquiry number. Please try again.');
}

/** Saves changes to an enquiry. Pass `followUps` (the whole array) to change its follow-ups. */
export function updateEnquiry(id, changes) {
  return updateDoc(enquiryRef(id), { ...changes, updatedAt: serverTimestamp() });
}
