export const SEAT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  AISLE: "AISLE",
};

export const isAisleSeat = (seat) => seat?.status === SEAT_STATUS.AISLE;

export const isInactiveSeat = (seat) => seat?.status === SEAT_STATUS.INACTIVE;

export const getSeatColumnOrder = (seatColumn) => {
  if (seatColumn == null || seatColumn === "") return 0;

  const raw = String(seatColumn).trim();
  if (/^\d+$/.test(raw)) {
    return parseInt(raw, 10);
  }

  const letter = raw.toUpperCase();
  if (letter.length === 1 && letter >= "A" && letter <= "Z") {
    return letter.charCodeAt(0) - 64;
  }

  return 0;
};

export const compareSeatsByPosition = (a, b) => {
  if (a.seatRow !== b.seatRow) return a.seatRow - b.seatRow;
  return getSeatColumnOrder(a.seatColumn) - getSeatColumnOrder(b.seatColumn);
};

export const getSeatLabel = (seat, getRowLetter) => {
  const rowLabel =
    typeof getRowLetter === "function"
      ? getRowLetter(seat.seatRow)
      : String(seat.seatRow ?? "").trim();
  const columnNumber = getSeatColumnOrder(seat.seatColumn);

  return `${rowLabel}${columnNumber}`;
};

/**
 * Kiểm tra quy định chọn ghế:
 * - Khi chọn 2 ghế: Bắt buộc ở cùng một hàng và nằm cạnh nhau.
 * - Khi chọn > 2 ghế: Các ghế chọn trong cùng một hàng phải nằm liền kề (liên tiếp).
 */
export const validateAdjacentSeats = (selectedSeats) => {
  if (!selectedSeats || selectedSeats.length === 0) {
    return { valid: true };
  }

  if (selectedSeats.length === 2) {
    const [s1, s2] = selectedSeats;
    if (s1.seatRow !== s2.seatRow) {
      return {
        valid: false,
        message: "Khi chọn 2 ghế, các ghế phải ở cùng một hàng và nằm cạnh nhau!",
      };
    }
    const col1 = getSeatColumnOrder(s1.seatColumn);
    const col2 = getSeatColumnOrder(s2.seatColumn);
    if (Math.abs(col1 - col2) !== 1) {
      return {
        valid: false,
        message: "Khi chọn 2 ghế, các ghế phải ở cùng một hàng và nằm cạnh nhau!",
      };
    }
    return { valid: true };
  }

  const seatsByRow = {};
  selectedSeats.forEach((seat) => {
    const r = seat.seatRow;
    if (!seatsByRow[r]) seatsByRow[r] = [];
    seatsByRow[r].push(seat);
  });

  for (const rowNum in seatsByRow) {
    const rowSeats = seatsByRow[rowNum];
    if (rowSeats.length > 1) {
      const sortedCols = rowSeats
        .map((s) => getSeatColumnOrder(s.seatColumn))
        .sort((a, b) => a - b);
      for (let i = 0; i < sortedCols.length - 1; i++) {
        if (sortedCols[i + 1] - sortedCols[i] !== 1) {
          return {
            valid: false,
            message: "Các ghế được chọn trong cùng một hàng phải nằm liền kề nhau!",
          };
        }
      }
    }
  }

  return { valid: true };
};

