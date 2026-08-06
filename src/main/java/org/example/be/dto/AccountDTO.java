package org.example.be.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {
    private String accountId;
    private String username;
    
    // Chỉ cho phép GỬI LÊN, không bao giờ TRẢ VỀ mật khẩu
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String gender;
    private String image;
    private String roleName;
    private Integer status;
    private LocalDateTime registerDate;
    private String createdBy;
}
