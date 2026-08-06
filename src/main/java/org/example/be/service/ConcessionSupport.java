package org.example.be.service;

import org.example.be.dto.ConcessionPriceRequestDTO;
import org.example.be.enums.ConcessionSize;
import org.example.be.enums.ConcessionStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

final class ConcessionSupport {

    /** Giá bán tối đa cho mỗi size (đồng). */
    static final BigDecimal MAX_PRICE = BigDecimal.valueOf(10_000_000L);

    private ConcessionSupport() {
    }

    static String requireName(String rawName) {
        String trimmed = rawName == null ? "" : rawName.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập tên.");
        }
        return trimmed;
    }

    static void validatePrices(List<ConcessionPriceRequestDTO> prices) {
        if (prices == null || prices.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một loại giá.");
        }

        List<ConcessionSize> sizes = prices.stream()
                .map(ConcessionPriceRequestDTO::getSize)
                .collect(Collectors.toList());

        if (sizes.size() != sizes.stream().distinct().count()) {
            throw new IllegalArgumentException("Không được nhập trùng loại kích cỡ giá.");
        }

        for (ConcessionPriceRequestDTO price : prices) {
            if (price.getPrice() == null || price.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá bán phải lớn hơn 0.");
            }
            if (price.getPrice().compareTo(MAX_PRICE) > 0) {
                throw new IllegalArgumentException(
                        "Giá bán tối đa là " + MAX_PRICE.toPlainString() + "đ.");
            }
            if (price.getSize() == null) {
                throw new IllegalArgumentException("Vui lòng chọn kích cỡ giá.");
            }
        }

        if (sizes.contains(ConcessionSize.NONE) && sizes.size() > 1) {
            throw new IllegalArgumentException(
                    "Loại giá Tiêu chuẩn không thể kết hợp với Nhỏ/Vừa/Lớn.");
        }
    }

    static ConcessionStatus resolveRequestStatus(String status) {
        if (status == null || status.isBlank()) {
            return ConcessionStatus.ACTIVE;
        }
        ConcessionStatus parsed;
        try {
            parsed = ConcessionStatus.valueOf(status);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ.");
        }
        if (parsed == ConcessionStatus.DELETED) {
            throw new IllegalArgumentException("Trạng thái chỉ được là Đang bán hoặc Ngừng bán.");
        }
        return parsed;
    }
}
