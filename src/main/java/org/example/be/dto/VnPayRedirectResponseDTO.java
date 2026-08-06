package org.example.be.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VnPayRedirectResponseDTO {
    private String payUrl;
    private Integer invoiceId;
}
