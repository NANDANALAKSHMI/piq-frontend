import { units, unitDistances } from '../../data/unitsData.js';

/** Units sorted by distance to a city; unknown cities keep the default order. */
export function rankUnitsForCity(city) {
  const distances = unitDistances[city];
  return units
    .map((unit) => ({ ...unit, distance: distances?.[unit.id] ?? null }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

/** Preferred, then approved vendors in a category that serve the unit. */
export function suggestVendors(vendors, categoryId, unitId) {
  const rank = { Preferred: 0, Approved: 1, 'On hold': 2 };
  return vendors
    .filter((v) => v.categoryIds.includes(categoryId) && v.status !== 'On hold')
    .sort((a, b) => {
      const servesA = a.unitIds.includes(unitId) ? 0 : 1;
      const servesB = b.unitIds.includes(unitId) ? 0 : 1;
      return servesA - servesB || rank[a.status] - rank[b.status];
    });
}
