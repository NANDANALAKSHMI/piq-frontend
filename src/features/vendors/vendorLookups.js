/**
 * Turns a vendor's stored ids into names. A vendor's categories are services from the Services page
 * (`serviceIds`), and the services it offers are their sub-services (`subServiceIds`). Ids that were
 * deleted on the Services page are simply skipped.
 */
export function buildVendorLookups(services) {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const subServiceMap = new Map(services.flatMap((s) => s.subServices.map((sub) => [sub.id, sub])));
  const names = (map, ids) => ids.map((id) => map.get(id)?.name).filter(Boolean);

  return {
    categoryNames: (vendor) => names(serviceMap, vendor.serviceIds),
    serviceNames: (vendor) => names(subServiceMap, vendor.subServiceIds),
    /** [{ category, services: [names] }] for each of the vendor's categories that still exists. */
    servicesByCategory: (vendor) =>
      vendor.serviceIds
        .map((id) => serviceMap.get(id))
        .filter(Boolean)
        .map((category) => ({
          category,
          services: category.subServices.filter((sub) => vendor.subServiceIds.includes(sub.id)).map((sub) => sub.name),
        })),
  };
}
