package org.example.be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDTO {
    private String accountId;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String identityCard;
    private String address;
    private String gender;
    private LocalDate dateOfBirth;
    private String image;
    private Integer status;
    private LocalDateTime registerDate;
    private String createdBy;
}
