export const pad2 = (n) => String(n).padStart(2, '0');
export const monthKeyOf = (y, mIdx) => `${y}-${pad2(mIdx + 1)}`;
export const monthFromTo = (y, mIdx) => {
  const fromDate = `${y}-${pad2(mIdx + 1)}-01`;
  const last = new Date(y, mIdx + 1, 0).getDate();
  const toDate = `${y}-${pad2(mIdx + 1)}-${pad2(last)}`;
  return { fromDate, toDate };
};