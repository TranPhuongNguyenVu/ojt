/** Thời gian giữ ghế DRAFT sau khi chọn MoMo rồi thoát trang thanh toán (ms). */
export const MOMO_HOLD_MS = 3 * 60 * 1000;

const storageKey = (scheduleId) => `momo_seat_hold_${scheduleId}`;

export function saveMomoSeatHold(scheduleId, seatIds) {
  if (!scheduleId || !seatIds?.length) return;
  sessionStorage.setItem(
    storageKey(scheduleId),
    JSON.stringify({
      seatIds,
      expiresAt: Date.now() + MOMO_HOLD_MS,
    })
  );
}

export function getMomoSeatHold(scheduleId) {
  try {
    const raw = sessionStorage.getItem(storageKey(scheduleId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.expiresAt || data.expiresAt <= Date.now()) {
      clearMomoSeatHold(scheduleId);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearMomoSeatHold(scheduleId) {
  sessionStorage.removeItem(storageKey(scheduleId));
}

export function formatHoldCountdown(remainingMs) {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
