export const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === 'object') return Object.values(v);
  return [v];
};
