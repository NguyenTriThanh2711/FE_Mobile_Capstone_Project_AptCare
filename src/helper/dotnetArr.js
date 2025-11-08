export function dotnetArr(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.$values)) return x.$values;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.items?.$values)) return x.items.$values;
  if (x.repairReportId != null || x.appointmentId != null || x.createdAt != null) return [x];
  return [];
}
