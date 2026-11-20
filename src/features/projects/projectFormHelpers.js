/** Preferred, then approved vendors offering a service (a category on the vendor form). */
export function suggestVendors(vendors, serviceId) {
  const rank = { Preferred: 0, Approved: 1, 'On hold': 2 };
  return vendors
    .filter((v) => v.serviceIds.includes(serviceId) && v.status !== 'On hold')
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
