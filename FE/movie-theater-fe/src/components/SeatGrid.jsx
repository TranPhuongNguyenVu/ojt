import React, { useState, useEffect } from "react";
import { isAisleSeat, isInactiveSeat } from "../utils/seatUtils";

const getColumnIndex = (column) => {
  if (!column) return 0;
  const num = parseInt(column, 10);
  if (!isNaN(num)) {
    return num - 1;
  }
  let index = 0;
  const colStr = String(column).toUpperCase();
  for (let i = 0; i < colStr.length; i++) {
    index = index * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  return index - 1;
};

const getRowLetter = (rowNum) => {
  return String.fromCharCode(64 + rowNum);
};

const SeatGrid = ({
  seats = [],
  selectedSeats = [],
  onSeatClick,
  isAdmin = false,
  onSelectRow,
  onSelectColumn,
  showPrices = false,
  currentAccountId = null,
  tabHeldSeatIds = null,
}) => {
  const cellHeightClass = showPrices ? "h-14" : "h-9";
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("select");

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!seats || seats.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-gray-400">
        No seats available.
      </div>
    );
  }

  const seatsByRow = seats.reduce((acc, seat) => {
    const r = seat.seatRow;
    if (!acc[r]) acc[r] = [];
    acc[r].push(seat);
    return acc;
  }, {});

  const rowNums = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  let maxColIndex = 0;
  seats.forEach((s) => {
    const colIdx = getColumnIndex(s.seatColumn);
    if (colIdx > maxColIndex) {
      maxColIndex = colIdx;
    }
  });
  const totalColumns = maxColIndex + 1;

  const columnValues = [];
  for (let c = 0; c < totalColumns; c++) {
    const seatAtColumn = seats.find((s) => getColumnIndex(s.seatColumn) === c);
    columnValues[c] = seatAtColumn ? seatAtColumn.seatColumn : String(c + 1);
  }

  const handleMouseDown = (seat, e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    const mode = isSelected ? "deselect" : "select";
    setDragMode(mode);
    setIsDragging(true);
    if (onSeatClick) {
      onSeatClick(seat, mode);
    }
  };

  const handleMouseEnter = (seat) => {
    if (isDragging && onSeatClick) {
      onSeatClick(seat, dragMode);
    }
  };

  const renderSeat = (seat, rowSeats) => {
    const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
    const isCouple = seat.seatType === 2;
    const isAisle = isAisleSeat(seat);
    const isInactive = isInactiveSeat(seat);
    const isBooked = seat.bookingStatus === 1;
    const isOwnDraft =
      tabHeldSeatIds != null
        ? seat.bookingStatus === 2 && tabHeldSeatIds.has(Number(seat.seatId))
        : seat.bookingStatus === 2 &&
          !!currentAccountId &&
          seat.reservedBy === currentAccountId;
    const isDraftHeldByOther = seat.bookingStatus === 2 && !isOwnDraft;

    if (isAisle) {
      if (isAdmin) {
        let deletedClass = isSelected
          ? "bg-sky-500 text-white border-2 border-sky-600 shadow-lg"
          : "border border-dashed border-slate-400 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-gray-700 hover:border-slate-500";
        return (
          <button
            key={seat.seatId}
            type="button"
            onMouseDown={(e) => handleMouseDown(seat, e)}
            onMouseEnter={() => handleMouseEnter(seat)}
            className={`${cellHeightClass} w-full rounded text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer ${deletedClass}`}
          >
            {isSelected ? "✓" : "Aisle"}
          </button>
        );
      }
      return <div key={seat.seatId} className={`${cellHeightClass} w-full`}></div>;
    }

    let seatClass;
    const colNum = getColumnIndex(seat.seatColumn) + 1;
    let content = String(colNum);
    let spanStyle = {};

    if (isCouple && seat.pairSeatId) {
      const partner = rowSeats.find((x) => x.seatId === seat.pairSeatId);
      if (partner) {
        spanStyle = { gridColumn: "span 2" };
        const partnerColNum = getColumnIndex(partner.seatColumn) + 1;
        content = `${colNum}-${partnerColNum}`;
      }
    }

    if (isSelected || isOwnDraft) {
      seatClass = "bg-sky-500 text-white font-black shadow-lg border-2 border-sky-600";
    } else if (isBooked) {
      seatClass = "bg-slate-500 text-white cursor-not-allowed line-through";
    } else if (isDraftHeldByOther) {
      seatClass = "bg-amber-400 text-amber-950 cursor-not-allowed border border-amber-500";
    } else if (isInactive) {
      seatClass = "bg-slate-300 dark:bg-gray-700 text-slate-600 dark:text-gray-400 border border-slate-400 dark:border-gray-600 line-through cursor-not-allowed";
      if (isAdmin) {
        seatClass = "bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400 border border-slate-400 dark:border-gray-600 line-through hover:bg-slate-300 dark:hover:bg-gray-600";
      }
    } else if (seat.seatType === 1) {
      seatClass = "bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 font-bold";
    } else if (isCouple) {
      seatClass = "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black border-none hover:from-pink-600 hover:to-rose-600";
    } else {
      seatClass = "bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 border border-slate-300 dark:border-gray-600";
    }

    const disabledState = !isAdmin && (isBooked || isDraftHeldByOther || isInactive);
    const priceLabel = showPrices ? seat.priceLabel : null;

    return (
      <button
        key={seat.seatId}
        type="button"
        style={spanStyle}
        disabled={disabledState}
        onMouseDown={(e) => handleMouseDown(seat, e)}
        onMouseEnter={() => handleMouseEnter(seat)}
        title={priceLabel ? `Giá: ${priceLabel}` : undefined}
        className={`${cellHeightClass} w-full rounded text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${seatClass}`}
      >
        <span>{content}</span>
        {priceLabel && <span className="text-[9px] font-semibold opacity-75">{priceLabel}</span>}
      </button>
    );
  };

  const buildRowElements = (rowSeats) => {
    const elements = [];
    const renderedIds = new Set();

    const seatMap = {};
    rowSeats.forEach((seat) => {
      seatMap[getColumnIndex(seat.seatColumn)] = seat;
    });

    for (let c = 0; c < totalColumns; c++) {
      const seat = seatMap[c];
      if (!seat) {
        elements.push(<div key={`gap-${c}`} className={`${cellHeightClass} w-full`}></div>);
        continue;
      }

      if (renderedIds.has(seat.seatId)) {
        continue;
      }

      if (isAisleSeat(seat)) {
        elements.push(renderSeat(seat, rowSeats));
        continue;
      }

      const isCouple = seat.seatType === 2;
      if (isCouple && seat.pairSeatId) {
        const partner = rowSeats.find((s) => s.seatId === seat.pairSeatId);
        if (partner) {
          renderedIds.add(partner.seatId);
          elements.push(renderSeat(seat, rowSeats));
          continue;
        }
      }

      elements.push(renderSeat(seat, rowSeats));
    }

    return elements;
  };

  const RowLabel = ({ rowLetter, rowNum }) =>
    onSelectRow ? (
      <button
        type="button"
        onClick={() => onSelectRow(rowNum)}
        title="Chọn cả hàng"
        className="w-6 text-xs font-black text-slate-400 dark:text-gray-500 text-center hover:text-amber-600 cursor-pointer"
      >
        {rowLetter}
      </button>
    ) : (
      <span className="w-6 text-xs font-black text-slate-400 dark:text-gray-500 text-center">{rowLetter}</span>
    );

  return (
    <div className="overflow-x-auto py-6 flex justify-center select-none">
      <div className="inline-block space-y-3 min-w-[640px]">
        {onSelectColumn && (
          <div className="flex items-center gap-3">
            <span className="w-6" />
            <div
              className="flex-1 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
                width: `${totalColumns * 40}px`,
              }}
            >
              {columnValues.map((colValue, idx) => (
                <button
                  key={`col-${colValue}-${idx}`}
                  type="button"
                  onClick={() => onSelectColumn(colValue)}
                  title="Chọn cả cột"
                  className="h-6 text-[10px] font-black text-slate-400 dark:text-gray-500 hover:text-amber-600 cursor-pointer"
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <span className="w-6" />
          </div>
        )}
        {rowNums.map((rowNum) => {
          const rowLetter = getRowLetter(rowNum);
          const rowSeats = seatsByRow[rowNum] || [];

          return (
            <div key={rowNum} className="flex items-center gap-3">
              <RowLabel rowLetter={rowLetter} rowNum={rowNum} />

              <div
                className="flex-1 grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`,
                  width: `${totalColumns * 40}px`,
                }}
              >
                {buildRowElements(rowSeats)}
              </div>

              <RowLabel rowLetter={rowLetter} rowNum={rowNum} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeatGrid;
