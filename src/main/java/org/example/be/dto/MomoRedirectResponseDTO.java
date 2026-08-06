package org.example.be.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoRedirectResponseDTO {
    private String payUrl;
    private Integer invoiceId;
}
