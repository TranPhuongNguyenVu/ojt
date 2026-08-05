import { Client } from '@stomp/stompjs';

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return 'ws://localhost:8080/ws-seats';
  }
  if (window.location.hostname === "ojt-f8jy.onrender.com") {
    return 'wss://ojt-f8jy.onrender.com/ws-seats';
  }
  return 'wss://cinemapromaxbe-epfzgtawb0g9bjdj.centralindia-01.azurewebsites.net/ws-seats';
};

const WS_URL = getWsUrl();

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
 * Apply a seat status event onto the local seats array.
 */
export function applySeatStatusEvent(seats, event) {
  if (!event?.seats?.length) return seats;
  const map = new Map(event.seats.map((s) => [s.seatId, s]));
  return seats.map((seat) => {
    const update = map.get(seat.seatId);
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
