package org.example.be.service;

import org.example.be.dto.ConcessionPriceRequestDTO;
import org.example.be.enums.ConcessionSize;
import org.example.be.enums.ConcessionStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

final class ConcessionSupport {

    private ConcessionSupport() {
    }

    static String requireName(String rawName) {
        String trimmed = rawName == null ? "" : rawName.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        return trimmed;
    }

    static void validatePrices(List<ConcessionPriceRequestDTO> prices) {
        if (prices == null || prices.isEmpty()) {
            throw new IllegalArgumentException("At least one price is required");
        }

        List<ConcessionSize> sizes = prices.stream()
                .map(ConcessionPriceRequestDTO::getSize)
                .collect(Collectors.toList());

        if (sizes.size() != sizes.stream().distinct().count()) {
            throw new IllegalArgumentException("Duplicate price sizes are not allowed");
        }

        for (ConcessionPriceRequestDTO price : prices) {
            if (price.getPrice() == null || price.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Price must be positive");
            }
        }

        if (sizes.contains(ConcessionSize.NONE) && sizes.size() > 1) {
            throw new IllegalArgumentException("Size NONE must be the only price row");
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
            throw new IllegalArgumentException("Invalid status");
        }
        if (parsed == ConcessionStatus.DELETED) {
            throw new IllegalArgumentException("Status must be ACTIVE or INACTIVE");
        }
        return parsed;
    }
}
