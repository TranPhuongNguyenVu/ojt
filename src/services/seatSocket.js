import { Client } from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8080/ws-seats';

/**
 * Subscribe realtime seat status for a schedule.
 * @returns {() => void} unsubscribe / disconnect
 */
export function subscribeSeatUpdates(scheduleId, onUpdate) {
  if (!scheduleId || typeof onUpdate !== 'function') {
    return () => {};
  }

  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(`/topic/seats/${scheduleId}`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          onUpdate(payload);
        } catch (err) {
          console.error('Invalid seat WS payload', err);
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame.headers['message'], frame.body);
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
}

/**
 * Ghi nhận trạng thái ghế mà tab này vừa hold/release (HTTP hoặc optimistic).
 * Dùng để bỏ qua WS event cũ khi user chọn/bỏ chọn liên tục.
 *
 * @param {Map<number, { status: number, reservedBy?: string|null, at?: number }>} localSeatState
 * @param {number[]} seatIds
 * @param {number} status 0=AVAILABLE, 1=BOOKED, 2=DRAFT
 * @param {string|null} [reservedBy]
 */
export function rememberLocalSeatState(localSeatState, seatIds, status, reservedBy = null) {
  if (!localSeatState || !seatIds?.length) return;
  const at = Date.now();
  seatIds.forEach((id) => {
    localSeatState.set(Number(id), {
      status,
      reservedBy: reservedBy ?? null,
      at,
    });
  });
}

function isSameAccount(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * WS event có nên áp dụng không, so với trạng thái HTTP/optimistic gần nhất của tab này.
 * Tránh: hold cũ của CHÍNH MÌNH đến sau release → ghế vàng;
 * vẫn nhận hold của USER KHÁC để hiện vàng realtime giữa 2 màn hình.
 */
export function shouldApplySeatUpdate(update, localSeatState, currentAccountId) {
  if (!update || update.seatId == null) return false;
  if (!localSeatState || localSeatState.size === 0) return true;

  const local = localSeatState.get(Number(update.seatId));
  if (!local) return true;

  const remote = update.bookingStatus;

  // BOOKED từ server luôn thắng
  if (remote === 1) return true;

  // Tab đang giữ — bỏ qua AVAILABLE cũ từ lần nhả trước
  if (local.status === 2 && remote === 0) return false;

  // Tab đã nhả — chỉ bỏ qua DRAFT echo của chính account này (tránh vàng sau hủy).
  // DRAFT của user khác VẪN áp dụng → màn hình kia hiện vàng realtime.
  if (local.status === 0 && remote === 2) {
    const ownDraft =
      isSameAccount(update.reservedBy, currentAccountId) ||
      isSameAccount(update.reservedBy, local.reservedBy);
    if (ownDraft) return false;
    return true;
  }

  return true;
}

/**
 * Ghế DRAFT từ WS có phải do chính tab này đang hold không (để gắn tabHeld, tránh vàng).
 */
export function isOwnInFlightDraft(update, localSeatState, currentAccountId) {
  if (!update || update.bookingStatus !== 2) return false;
  const local = localSeatState?.get(Number(update.seatId));
  if (!local || local.status !== 2) return false;
  return (
    isSameAccount(update.reservedBy, currentAccountId) ||
    isSameAccount(update.reservedBy, local.reservedBy)
  );
}

/**
 * Áp localSeatState lên danh sách ghế lấy từ API (tránh server DRAFT cũ làm ghế vàng sau khi đã nhả).
 */
export function reconcileSeatsWithLocalState(seats, localSeatState, currentAccountId) {
  if (!seats?.length || !localSeatState?.size) return seats;
  return seats.map((seat) => {
    const local = localSeatState.get(Number(seat.seatId));
    if (!local) return seat;

    if (local.status === 0 && seat.bookingStatus === 2) {
      // Đã nhả ở tab này — không hiện vàng dù server/WS còn DRAFT
      if (
        !seat.reservedBy ||
        isSameAccount(seat.reservedBy, currentAccountId) ||
        isSameAccount(seat.reservedBy, local.reservedBy)
      ) {
        return { ...seat, bookingStatus: 0, reservedBy: null, reservedAt: null };
      }
    }

    if (local.status === 2 && seat.bookingStatus === 0) {
      // Đang hold ở tab này — giữ DRAFT local nếu API chưa kịp
      return {
        ...seat,
        bookingStatus: 2,
        reservedBy: local.reservedBy || currentAccountId,
        reservedAt: seat.reservedAt || new Date().toISOString(),
      };
    }

    return seat;
  });
}

/**
 * Apply a seat status event onto the local seats array.
 */
export function applySeatStatusEvent(seats, event, options = {}) {
  if (!event?.seats?.length) return seats;
  const { localSeatState, currentAccountId } = options;

  const map = new Map();
  for (const s of event.seats) {
    if (!shouldApplySeatUpdate(s, localSeatState, currentAccountId)) continue;
    map.set(Number(s.seatId), s);
  }
  if (map.size === 0) return seats;

  return seats.map((seat) => {
    const update = map.get(Number(seat.seatId));
    if (!update) return seat;
    return {
      ...seat,
      bookingStatus: update.bookingStatus,
      reservedBy:
        update.bookingStatus === 0 || update.bookingStatus === 1
          ? null
          : (update.reservedBy ?? seat.reservedBy),
      reservedAt:
        update.bookingStatus === 0 || update.bookingStatus === 1
          ? null
          : (update.reservedAt ?? seat.reservedAt),
    };
  });
}
