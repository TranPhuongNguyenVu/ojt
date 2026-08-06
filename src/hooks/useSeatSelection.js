import { useState } from "react";
import { isAisleSeat, isInactiveSeat } from "../utils/seatUtils";

export const useSeatSelection = ({
  seats = [],
  initialSelected = [],
  maxSelect = 8,
  isAdmin = false,
} = {}) => {
  const [selectedSeats, setSelectedSeats] = useState(initialSelected);

  const toggleSeat = (seat, forceState, onWarning) => {
    let state = forceState;
    let warnCallback = onWarning;
    if (typeof forceState === "function") {
      warnCallback = forceState;
      state = undefined;
    }

    if (!isAdmin) {
      if (seat.bookingStatus === 1 || isAisleSeat(seat) || isInactiveSeat(seat)) {
        return;
      }
    }

    const isCouple = seat.seatType === 2 && seat.pairSeatId;
    const partner = isCouple ? seats.find(s => s.seatId === seat.pairSeatId) : null;

    if (!isAdmin && isCouple && partner) {
      if (partner.bookingStatus === 1 || isAisleSeat(partner) || isInactiveSeat(partner)) {
        if (warnCallback) {
          warnCallback("This couple seat is currently unavailable.");
        }
        return;
      }
    }

    const isSelected = selectedSeats.some(s => s.seatId === seat.seatId);
    const shouldSelect = state ? state === "select" : !isSelected;

    if (!shouldSelect) {
      if (isCouple && partner) {
        setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId && s.seatId !== partner.seatId));
      } else {
        setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.seatId));
      }
    } else {
      const toAdd = [];
      if (!selectedSeats.some(s => s.seatId === seat.seatId)) {
        toAdd.push(seat);
      }
      if (isCouple && partner && !selectedSeats.some(s => s.seatId === partner.seatId)) {
        toAdd.push(partner);
      }

      if (toAdd.length === 0) return;

      if (!isAdmin && selectedSeats.length + toAdd.length > maxSelect) {
        if (warnCallback) {
          warnCallback(`You can only select up to ${maxSelect} seats.`);
        }
        return;
      }

      setSelectedSeats(prev => [...prev, ...toAdd]);
    }
  };

  const clearSelection = () => setSelectedSeats([]);

  const selectLine = (lineSeats) => {
    const selectableSeats = isAdmin
      ? lineSeats
      : lineSeats.filter((s) => !isAisleSeat(s));
    if (selectableSeats.length === 0) return;

    const allSelected = selectableSeats.every((s) =>
      selectedSeats.some((sel) => sel.seatId === s.seatId)
    );

    if (allSelected) {
      setSelectedSeats((prev) =>
        prev.filter((s) => !selectableSeats.some((ls) => ls.seatId === s.seatId))
      );
    } else {
      setSelectedSeats((prev) => {
        const existingIds = new Set(prev.map((s) => s.seatId));
        const toAdd = selectableSeats.filter((s) => !existingIds.has(s.seatId));
        return [...prev, ...toAdd];
      });
    }
  };

  const selectRow = (rowNum) => selectLine(seats.filter((s) => s.seatRow === rowNum));

  const selectColumn = (columnValue) => selectLine(seats.filter((s) => s.seatColumn === columnValue));

  return {
    selectedSeats,
    setSelectedSeats,
    toggleSeat,
    clearSelection,
    selectRow,
    selectColumn,
  };
};
