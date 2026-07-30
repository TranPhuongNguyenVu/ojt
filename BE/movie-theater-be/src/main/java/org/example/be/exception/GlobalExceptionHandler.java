package org.example.be.exception;

import lombok.Getter;
import org.example.be.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.access.AccessDeniedException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Getter
    public static class SeatCountExceedsMaxException extends RuntimeException {

        public static final String ERROR_CODE = "SEAT_COUNT_EXCEEDS_MAX";

        private final int actualSeatCount;
        private final int maxSeats;
        private final Integer requestedMaxSeats;
        private final Integer currentMaxSeats;

        public SeatCountExceedsMaxException(int actualSeatCount, int maxSeats) {
            super("Số ghế trong sơ đồ (" + actualSeatCount + ") vượt quá sức chứa tối đa (" + maxSeats + ").");
            this.actualSeatCount = actualSeatCount;
            this.maxSeats = maxSeats;
            this.requestedMaxSeats = null;
            this.currentMaxSeats = null;
        }

        public SeatCountExceedsMaxException(int actualSeatCount, int requestedMaxSeats, int currentMaxSeats) {
            super("Số ghế trong sơ đồ (" + actualSeatCount + ") vượt quá sức chứa tối đa (" + requestedMaxSeats + ").");
            this.actualSeatCount = actualSeatCount;
            this.maxSeats = requestedMaxSeats;
            this.requestedMaxSeats = requestedMaxSeats;
            this.currentMaxSeats = currentMaxSeats;
        }
    }

    @Getter
    public static class InvalidFormatCombinationException extends RuntimeException {

        public static final String ERROR_CODE = "INVALID_FORMAT_COMBINATION";

        private final List<String> selectedFormats;

        public InvalidFormatCombinationException(String message, List<String> selectedFormats) {
            super(message);
            this.selectedFormats = selectedFormats;
        }
    }

    @Getter
    public static class InvalidCoupleSeatPairException extends RuntimeException {

        public static final String ERROR_CODE = "INVALID_COUPLE_SEAT_PAIR";

        private final Integer seatId;
        private final Integer pairSeatId;

        public InvalidCoupleSeatPairException(String message, Integer seatId, Integer pairSeatId) {
            super(message);
            this.seatId = seatId;
            this.pairSeatId = pairSeatId;
        }
    }

    @Getter
    public static class PriceChangeConflictException extends RuntimeException {

        public static final String ERROR_CODE = "PRICE_CHANGE_AFFECTS_SHOWTIMES";

        private final long affectedShowtimes;

        public PriceChangeConflictException(long affectedShowtimes) {
            super("Có " + affectedShowtimes + " suất chiếu trong tương lai bị ảnh hưởng bởi thay đổi giá này.");
            this.affectedShowtimes = affectedShowtimes;
        }
    }

    @ExceptionHandler(PriceChangeConflictException.class)
    public ResponseEntity<ApiResponse<org.example.be.dto.PriceChangeConflictDTO>> handlePriceChangeConflictException(
            PriceChangeConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<org.example.be.dto.PriceChangeConflictDTO>builder()
                        .status(409)
                        .message(ex.getMessage())
                        .data(org.example.be.dto.PriceChangeConflictDTO.builder()
                                .affectedShowtimes(ex.getAffectedShowtimes())
                                .build())
                        .build());
    }

    // Bắt các lỗi do Validate / Logic sai (Ví dụ trùng Email, Username...)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    // Bắt các lỗi vi phạm business rule (ví dụ: đang có lịch chiếu, ghế đã đặt...)
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, ex.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : ex.getBody().getDetail();
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(ex.getStatusCode().value(), message));
    }

    // Bắt các lỗi hệ thống không lường trước được (tránh bị sập sảng)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "Lỗi máy chủ: " + ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, "Cấm cửa! Bạn không đủ quyền để xem mục này."));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    // Bắt lỗi validate trên @RequestBody (@Valid trên DTO)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Dữ liệu không hợp lệ.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    // Bắt lỗi validate trên @RequestParam / @PathVariable (@Validated trên Controller)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .findFirst()
                .orElse("Dữ liệu không hợp lệ.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    // Bắt các lỗi trùng lặp/ràng buộc dữ liệu ở DB (UNIQUE constraints)
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        String message = "Dữ liệu bị trùng lặp hoặc không hợp lệ.";
        String rootMsg = ex.getRootCause() != null ? ex.getRootCause().getMessage() : "";

        if (rootMsg.contains("account_username_key") || rootMsg.toUpperCase().contains("USERNAME")) {
            message = "Tên đăng nhập đã được sử dụng.";
        } else if (rootMsg.contains("account_email_key") || rootMsg.toUpperCase().contains("EMAIL")) {
            message = "Email đã được sử dụng.";
        } else if (rootMsg.contains("account_phone_number_key") || rootMsg.toUpperCase().contains("PHONE_NUMBER")) {
            message = "Số điện thoại đã được sử dụng.";
        } else if (rootMsg.contains("account_identity_card_key") || rootMsg.toUpperCase().contains("IDENTITY_CARD")) {
            message = "CMND/CCCD đã được sử dụng.";
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(InvalidFormatCombinationException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleInvalidFormatCombination(InvalidFormatCombinationException ex) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("errorCode", InvalidFormatCombinationException.ERROR_CODE);
        details.put("selectedFormats", ex.getSelectedFormats());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(400, ex.getMessage(), details));
    }

    @ExceptionHandler(InvalidCoupleSeatPairException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleInvalidCoupleSeatPair(InvalidCoupleSeatPairException ex) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("errorCode", InvalidCoupleSeatPairException.ERROR_CODE);
        details.put("seatId", ex.getSeatId());
        details.put("pairSeatId", ex.getPairSeatId());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(400, ex.getMessage(), details));
    }

    @ExceptionHandler(SeatCountExceedsMaxException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleSeatCountExceedsMax(SeatCountExceedsMaxException ex) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("errorCode", SeatCountExceedsMaxException.ERROR_CODE);
        details.put("actualSeatCount", ex.getActualSeatCount());
        if (ex.getRequestedMaxSeats() != null) {
            details.put("requestedMaxSeats", ex.getRequestedMaxSeats());
            details.put("currentMaxSeats", ex.getCurrentMaxSeats());
            details.put("maxSeats", ex.getRequestedMaxSeats());
        } else {
            details.put("maxSeats", ex.getMaxSeats());
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(400, ex.getMessage(), details));
    }
}
