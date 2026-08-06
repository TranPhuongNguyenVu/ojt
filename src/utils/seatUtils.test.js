import { describe, expect, it } from "vitest";
import {
  SEAT_STATUS,
  compareSeatsByPosition,
  getSeatColumnOrder,
  getSeatLabel,
  isAisleSeat,
  isInactiveSeat,
  validateAdjacentSeats,
} from "./seatUtils";

describe("isAisleSeat / isInactiveSeat", () => {
  it("detects aisle seats", () => {
    expect(isAisleSeat({ status: SEAT_STATUS.AISLE })).toBe(true);
    expect(isAisleSeat({ status: SEAT_STATUS.ACTIVE })).toBe(false);
    expect(isAisleSeat(null)).toBe(false);
  });

  it("detects inactive seats", () => {
    expect(isInactiveSeat({ status: SEAT_STATUS.INACTIVE })).toBe(true);
    expect(isInactiveSeat({ status: SEAT_STATUS.ACTIVE })).toBe(false);
    expect(isInactiveSeat(undefined)).toBe(false);
  });
});

describe("getSeatColumnOrder", () => {
  it("parses numeric columns", () => {
    expect(getSeatColumnOrder("7")).toBe(7);
    expect(getSeatColumnOrder(" 12 ")).toBe(12);
  });

  it("maps single letter columns A-Z to 1-26", () => {
    expect(getSeatColumnOrder("A")).toBe(1);
    expect(getSeatColumnOrder("g")).toBe(7);
    expect(getSeatColumnOrder("Z")).toBe(26);
  });

  it("falls back to 0 for null, empty, or unrecognized input", () => {
    expect(getSeatColumnOrder(null)).toBe(0);
    expect(getSeatColumnOrder("")).toBe(0);
    expect(getSeatColumnOrder("AA")).toBe(0);
    expect(getSeatColumnOrder("#")).toBe(0);
  });
});

describe("compareSeatsByPosition", () => {
  it("orders by row first, then column", () => {
    const seats = [
      { seatRow: 2, seatColumn: "1" },
      { seatRow: 1, seatColumn: "3" },
      { seatRow: 1, seatColumn: "1" },
    ];
    const sorted = [...seats].sort(compareSeatsByPosition);
    expect(sorted).toEqual([
      { seatRow: 1, seatColumn: "1" },
      { seatRow: 1, seatColumn: "3" },
      { seatRow: 2, seatColumn: "1" },
    ]);
  });
});

describe("getSeatLabel", () => {
  it("uses the provided row-letter function plus the column order", () => {
    const getRowLetter = (row) => "ABCDEFGHIJ"[row - 1];
    expect(getSeatLabel({ seatRow: 6, seatColumn: "G" }, getRowLetter)).toBe("F7");
  });

  it("falls back to the raw row number when no row-letter function is given", () => {
    expect(getSeatLabel({ seatRow: 3, seatColumn: "2" })).toBe("32");
  });
});

describe("validateAdjacentSeats", () => {
  it("returns valid for 0 or 1 seat selected", () => {
    expect(validateAdjacentSeats([])).toEqual({ valid: true });
    expect(validateAdjacentSeats([{ seatRow: 4, seatColumn: "5" }])).toEqual({ valid: true });
  });

  it("validates 2 adjacent seats in the same row", () => {
    const validPair = [
      { seatRow: 4, seatColumn: "5" },
      { seatRow: 4, seatColumn: "6" },
    ];
    expect(validateAdjacentSeats(validPair)).toEqual({ valid: true });
  });

  it("rejects 2 non-adjacent seats in the same row", () => {
    const invalidPair = [
      { seatRow: 4, seatColumn: "5" },
      { seatRow: 4, seatColumn: "7" },
    ];
    const res = validateAdjacentSeats(invalidPair);
    expect(res.valid).toBe(false);
    expect(res.message).toContain("cạnh nhau");
  });

  it("rejects 2 seats in different rows", () => {
    const invalidDiffRows = [
      { seatRow: 4, seatColumn: "5" },
      { seatRow: 5, seatColumn: "5" },
    ];
    const res = validateAdjacentSeats(invalidDiffRows);
    expect(res.valid).toBe(false);
    expect(res.message).toContain("cùng một hàng");
  });

  it("rejects 3 seats with a gap in the same row (e.g. D5, D7, D8)", () => {
    const invalidTrio = [
      { seatRow: 4, seatColumn: "5" },
      { seatRow: 4, seatColumn: "7" },
      { seatRow: 4, seatColumn: "8" },
    ];
    const res = validateAdjacentSeats(invalidTrio);
    expect(res.valid).toBe(false);
    expect(res.message).toContain("liền kề");
  });
});

