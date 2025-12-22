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

export function timeDate(s) { // hh:mm dd/mm/yyyy
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

export function toLocalIsoNoOffset(date) {
  const d = date instanceof Date ? date : new Date(date);
  
  const pad = (n, len = 2) => String(n).padStart(len, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  const second = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);

  // KHÔNG thêm Z, KHÔNG thêm offset
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}`;
}

export const dayDate = (ds) => { // thứ, dd/mm/yyyy
  const [y,m,d] = ds.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
};
export const onlyTime = (ds) => { // hh:mm
  try {
    return new Date(ds).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ds;
  }
}