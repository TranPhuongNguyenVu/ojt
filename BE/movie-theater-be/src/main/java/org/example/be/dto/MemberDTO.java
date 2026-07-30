package org.example.be.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberDTO {
    // Thông tin gốc của Member
    private String memberId;
    private Integer score;

    // Thông tin đi mượn từ Account sang
    private String accountId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String gender;
    private String identityCard;
    private String username;
    private String address;
    private java.time.LocalDate dateOfBirth;
    private String image;
    private Integer status;
    private Integer roleId;
}