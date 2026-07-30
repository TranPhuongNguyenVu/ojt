package org.example.be.dto;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private AccountDTO account;
}