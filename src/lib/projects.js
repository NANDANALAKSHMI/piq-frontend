import { arrayUnion, collection, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firestore.js';

/**
 * Projects live in the Firestore `projects` collection — one document per project, keyed by its
 * number (PRJ-0001, PRJ-0002…). Services in scope, comments and the activity log are kept as arrays
 * on the document. Anyone on the team can manage them (see firestore.rules).
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const PROJECTS = 'projects';
const ID_PREFIX = 'PRJ-';

const projectRef = (id) => doc(db, PROJECTS, id);
const numberOf = (id) => Number(String(id).replace(/\D/g, '')) || 0;
const toDate = (value) => (typeof value?.toDate === 'function' ? value.toDate() : null);
const list = (value) => (Array.isArray(value) ? value : []);
const byTime = (a, b) => String(b.at ?? '').localeCompare(String(a.at ?? ''));

function toService(raw) {
  return {
    serviceId: raw.serviceId ?? '',
    name: raw.name ?? '',
    subServiceIds: list(raw.subServiceIds),
    ownerId: raw.ownerId ?? '',
    progress: Number(raw.progress) || 0,
  };
}

/** Firestore document → the project shape the rest of the app uses. */
function toProject(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? '',
    clientId: data.clientId ?? '',
    locationId: data.locationId ?? '',
    priority: data.priority ?? 'Medium',
    status: data.status ?? 'Upcoming',
    startDate: data.startDate ?? '',
    dueDate: data.dueDate ?? '',
    completedOn: data.completedOn ?? null,
    quantity: data.quantity ?? '',
    description: data.description ?? '',
    notes: data.notes ?? '',
    services: list(data.services).map(toService),
    teamIds: list(data.teamIds),
    vendorIds: list(data.vendorIds),
    createdFrom: data.createdFrom ?? null,
    keyDecision: data.keyDecision ?? null,
    // Comments oldest first (a conversation); activity newest first (a log).
    comments: list(data.comments).slice().sort((a, b) => -byTime(a, b)),
    activity: list(data.activity).slice().sort(byTime),
    searchVersion: data.searchVersion ?? 0,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Live list of projects, newest number first. */
export function subscribeToProjects(onChange, onError) {
  return onSnapshot(
    collection(db, PROJECTS),
    (snapshot) => onChange(snapshot.docs.map(toProject).sort((a, b) => numberOf(b.id) - numberOf(a.id))),
    onError,
  );
}

/**
 * Saves a new project under the next free number and resolves to that id. The number is claimed
 * in a transaction, so two people saving at the same moment can't end up with the same one.
 */
export async function createProject(draft, existingIds, createdBy) {
  let number = existingIds.reduce((highest, id) => Math.max(highest, numberOf(id)), 0) + 1;
  for (let attempt = 0; attempt < 25; attempt += 1, number += 1) {
    const id = `${ID_PREFIX}${String(number).padStart(4, '0')}`;
    const ref = projectRef(id);
    const created = await runTransaction(db, async (transaction) => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, { ...draft, code: id, createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return true;
    });
    if (created) return id;
  }
  throw new Error('Could not find a free project number. Please try again.');
}

/**
 * Saves changes to a project. `entry` (optional) is added to the activity log, and `comment`
 * (optional) to the comments — both with arrayUnion, so two people posting at once don't clash.
 */
export function updateProject(id, changes = {}, { entry, comment } = {}) {
  return updateDoc(projectRef(id), {
    ...changes,
    ...(entry ? { activity: arrayUnion(entry) } : {}),
    ...(comment ? { comments: arrayUnion(comment) } : {}),
    updatedAt: serverTimestamp(),
  });
}
