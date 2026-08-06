package org.example.be.util;

import org.example.be.entity.Seat;

public final class SeatLabelUtil {

    private static final String[] ROW_LETTERS = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};

    private SeatLabelUtil() {
    }

    public static String formatSeatLabel(Seat seat) {
        if (seat == null) {
            return "";
        }
        return getRowLetter(seat.getSeatRow()) + getSeatColumnOrder(seat.getSeatColumn());
    }

    private static String getRowLetter(Integer rowNum) {
        if (rowNum == null) {
            return "";
        }
        if (rowNum >= 1 && rowNum <= ROW_LETTERS.length) {
            return ROW_LETTERS[rowNum - 1];
        }
        return String.valueOf(rowNum);
    }

    private static int getSeatColumnOrder(String seatColumn) {
        if (seatColumn == null || seatColumn.isBlank()) {
            return 0;
        }
        String raw = seatColumn.trim();
        if (raw.matches("\\d+")) {
            return Integer.parseInt(raw);
        }
        String letter = raw.toUpperCase();
        if (letter.length() == 1 && letter.charAt(0) >= 'A' && letter.charAt(0) <= 'Z') {
            return letter.charAt(0) - 'A' + 1;
        }
        return 0;
    }
}
