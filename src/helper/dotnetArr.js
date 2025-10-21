export const dotnetArr = (o) => {
  if (!o) return [];                          // undefined/null -> []
  if (Array.isArray(o)) return o;         // đã là mảng
  if (o.$values && Array.isArray(o.$values)) return o.$values; // kiểu .NET
  return [];                                      // fallback
};
