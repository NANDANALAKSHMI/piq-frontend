import { arrayUnion, collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firestore.js';

/**
 * Cities, grouped by state and district, live in the Firestore `locations` collection: one
 * document per state, `{ name, districts: { [district]: [city, …] } }`. States and districts
 * themselves come from the bundled reference list (data/locationsData.js); cities are added by
 * the team as they're first used, then offered in the City dropdown from then on.
 *
 * This module is loaded on demand (dynamic import) so the Firestore SDK stays out of the first page load.
 */
const LOCATIONS = 'locations';

/** Firestore ids can't contain "/", so state names are turned into a safe id. */
const stateId = (state) => state.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function toState(snapshot) {
  const data = snapshot.data();
  const districts = {};
  Object.entries(data.districts ?? {}).forEach(([district, cities]) => {
    if (Array.isArray(cities)) districts[district] = [...new Set(cities.filter((c) => typeof c === 'string'))].sort((a, b) => a.localeCompare(b));
  });
  return { id: snapshot.id, name: data.name ?? snapshot.id, districts };
}

/** Live list of states that have saved cities. */
export function subscribeToLocations(onChange, onError) {
  return onSnapshot(collection(db, LOCATIONS), (snapshot) => onChange(snapshot.docs.map(toState)), onError);
}

/** Remembers a city under its state and district (does nothing if it's already there). */
export function addCity(state, district, city) {
  return setDoc(doc(db, LOCATIONS, stateId(state)), { name: state, districts: { [district]: arrayUnion(city) } }, { merge: true });
}
