/** Ghế DRAFT do CHÍNH tab/cửa sổ này giữ (tránh 2 tab cùng account nhận nhầm). */

const storageKey = (scheduleId) => `seat_tab_held_${scheduleId}`;

export function loadTabHeldSeatIds(scheduleId) {
  try {
    const raw = sessionStorage.getItem(storageKey(scheduleId));
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.map(Number) : []);
  } catch {
    return new Set();
  }
}

export function saveTabHeldSeatIds(scheduleId, seatIds) {
  const ids = [...seatIds].map(Number);
  sessionStorage.setItem(storageKey(scheduleId), JSON.stringify(ids));
}

export function clearTabHeldSeatIds(scheduleId) {
  sessionStorage.removeItem(storageKey(scheduleId));
}

export function addTabHeldSeatIds(scheduleId, seatIds) {
  const next = loadTabHeldSeatIds(scheduleId);
  seatIds.forEach((id) => next.add(Number(id)));
  saveTabHeldSeatIds(scheduleId, next);
  return next;
}

export function removeTabHeldSeatIds(scheduleId, seatIds) {
  const next = loadTabHeldSeatIds(scheduleId);
  seatIds.forEach((id) => next.delete(Number(id)));
  saveTabHeldSeatIds(scheduleId, next);
  return next;
}
