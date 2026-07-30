package org.example.be.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender; // Giới tính
    private String email;
    private String identityCard; // CMND/CCCD
    private String phoneNumber;
    private String address;
}