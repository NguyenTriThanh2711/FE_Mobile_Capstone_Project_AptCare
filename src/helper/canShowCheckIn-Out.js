// src/helper/canShowCheckIn-Out.js
//local time helper functions
const pad2 = (n) => String(n).padStart(2, '0');

// parse 'YYYY-MM-DD' -> { y, m, d }
function parseYmd(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map((x) => parseInt(x, 10));
  return { y, m, d };
}

// Tạo Date LOCAL từ ngày 'YYYY-MM-DD' và 'HH:mm:ss' (hoặc 'HH:mm')
export function dateAtLocal(dateStr, hhmmss) {
  const { y, m, d } = parseYmd(dateStr);
  const [hh, mm, ss] = String(hhmmss || '00:00:00').split(':').map((x) => parseInt(x, 10) || 0);
  // new Date(y, m-1, d, h, m, s) -> luôn là LOCAL TIME
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0, 0);
}

// phút từ bây giờ tới target (âm nếu target đã qua)
export function minutesFromNow(target) {
  return Math.floor((target.getTime() - Date.now()) / 60000);
}


// ==== Điều kiện hiển thị nút ====

function isNotStarted(shift) {
  return shift?.status === 'NotStarted';
}
function isWorking(shift) {
  return shift?.status === 'Working' || shift?.status === 'InProgress';
}
function isCompleted(shift) {
  return shift?.status === 'Completed';
}
/**
 * Check-in khả dụng khi:
 * - Chưa check-in & chưa check-out
 * - Thời điểm hiện tại nằm trong khoảng [start - 30 phút, end)
 *   (tuỳ chính sách, bạn có thể cho phép trễ sau start X phút)
 */
export function allowCheckIn(shift) {
  if (shift.checkedInAt || shift.checkedOutAt) return false;
  // defensive: thiếu time thì không bật nút
  if (!shift?.date || !shift?.fromTime || !shift?.toTime) return false;

  const start = dateAtLocal(shift.date, shift.fromTime);
  const end   = dateAtLocal(shift.date, shift.toTime);

  const minsToStart = minutesFromNow(start);
  const minsToEnd   = minutesFromNow(end);

  // trong vòng 30 phút trước giờ bắt đầu, cho đến khi ca kết thúc
  // ví dụ: cho phép trễ 60 phút sau giờ bắt đầu:
  const allowLateMinutes = 60; // đổi theo nhu cầu
  const minsSinceStart = -minsToStart; // >0 nghĩa là đã qua start

  const inEarlyWindow = minsToStart <= 30;       // <= 30' trước giờ bắt đầu
  const notPassedEnd  = minsToEnd > 0;              // chưa quá giờ kết thúc
  const notTooLate    = minsSinceStart <= allowLateMinutes;

  return inEarlyWindow && notPassedEnd && notTooLate;
}

/**
 * Check-out khả dụng khi:
 * - Đã check-in & chưa check-out
 * - Nằm trong 30 phút cuối trước giờ kết thúc hoặc sau đó
 */
export function allowCheckOut(shift) {
  if (!shift.checkedInAt || shift.checkedOutAt) return false;
  if (!shift?.date || !shift?.toTime) return false;

  const end = dateAtLocal(shift.date, shift.toTime);
  const minsToEnd = minutesFromNow(end);

  // <= 30' trước giờ kết thúc, hoặc đã qua giờ kết thúc
  return minsToEnd <= 30;
}
