export const formatDate = (iso) => new Date(iso).toLocaleString();

const today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0");
const yyyy = today.getFullYear();
const todayStr = `${dd}/${mm}/${yyyy}`;
export { todayStr };