export const formatDate = (iso) => new Date(iso).toLocaleString();

const today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0");
const yyyy = today.getFullYear();
const todayStr = `${dd}/${mm}/${yyyy}`;
export { todayStr };

export const toYMD = (d) => {
  if (typeof d === "string") return d.slice(0, 10);
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};