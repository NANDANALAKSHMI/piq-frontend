/** Preferred, then approved vendors in a category (a service from the Services page). */
export function suggestVendors(vendors, categoryId) {
  const rank = { Preferred: 0, Approved: 1, 'On hold': 2 };
  return vendors
    .filter((v) => v.serviceIds.includes(categoryId) && v.status !== 'On hold')
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
