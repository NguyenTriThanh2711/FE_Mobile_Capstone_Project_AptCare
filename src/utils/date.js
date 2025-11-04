const today = new Date();
const dd = String(today.getDate()).padStart(2, '0');
const mm = String(today.getMonth() + 1).padStart(2, '0');
const yyyy = today.getFullYear();
const todayStr = `${dd}/${mm}/${yyyy}`;
export { todayStr };

export const toYMD = (d) => { // yyyy-mm-dd
  if (typeof d === 'string') return d.slice(0, 10);
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function fmtDateTime(s) { // hh:mm dd/mm/yyyy
  try {
    return new Date(s).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}
export const timeDayDate = (s) => { // hh/mm, thứ, dd/mm/yyyy
  try {
    return new Date(s).toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
};

export function toOffsetISOString(date) {// hàm để tắt utc
  const pad = n => String(n).padStart(2, '0');
  const tzMin = -date.getTimezoneOffset();       // VN = +420
  const sign = tzMin >= 0 ? '+' : '-';
  const hhOff = pad(Math.floor(Math.abs(tzMin) / 60));
  const mmOff = pad(Math.abs(tzMin) % 60);

  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());

  return `${Y}-${M}-${D}T${h}:${m}:${s}${sign}${hhOff}:${mmOff}`;
}
