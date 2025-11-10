export const dotnetWrapIfObject = (x) => {
  const arr = dotnetArr(x);
  if (arr.length) return arr;         
  return x && typeof x === 'object' ? [x] : [];
};
export const dotnetArr = (o) => {
  if (!o) return [];
  if (Array.isArray(o)) return o;
  if (o.$values && Array.isArray(o.$values)) return o.$values; 
  return []; 
};

// hàm đệ quy tách $values trả về object/array
export function unwrapDotNetValuesDeep(data) {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(unwrapDotNetValuesDeep);
  if (typeof data === "object") {
    if (Array.isArray(data.$values)) return data.$values.map(unwrapDotNetValuesDeep);
    if (Array.isArray(data.items?.$values)) return data.items.$values.map(unwrapDotNetValuesDeep);
    const result = {};
    for (const key of Object.keys(data)) {
      result[key] = unwrapDotNetValuesDeep(data[key]);
    }
    return result;
  }
  return data;
}
