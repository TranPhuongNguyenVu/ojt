package org.example.be.dto;

import lombok.Data;

@Data
public class VerifyAndChangePasswordRequest {
    private String email;
    private String otpCode;
    private String newPassword;
}
