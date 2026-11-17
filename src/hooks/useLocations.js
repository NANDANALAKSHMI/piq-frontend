import { useCallback, useMemo } from 'react';
import useFirestoreList, { firestoreAction } from './useFirestoreList.js';

const load = () => import('../lib/locations.js');
const addCity = firestoreAction(load, 'addCity');

/**
 * Saved cities from Firestore. `citiesOf(state, district)` lists the cities already used in a
 * district; `addCity(state, district, city)` remembers a new one.
 */
export default function useLocations() {
  const { list, loading, error } = useFirestoreList(load, 'subscribeToLocations', 'locations');

  const citiesOf = useCallback(
    (state, district) => (state && district ? list.find((s) => s.name === state)?.districts[district] ?? [] : []),
    [list],
  );

  return useMemo(() => ({ citiesOf, addCity, loading, error }), [citiesOf, loading, error]);
}
