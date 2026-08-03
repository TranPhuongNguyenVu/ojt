package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ACCOUNT")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @UuidGenerator
    @Column(name = "ACCOUNT_ID", length = 36, updatable = false, nullable = false)
    private String accountId;

    @Column(name = "USERNAME", length = 50, unique = true, nullable = false)
    private String username;

    @Column(name = "PASSWORD", length = 255, nullable = false)
    private String password;

    @Column(name = "FULL_NAME", length = 255)
    private String fullName;

    @Column(name = "EMAIL", length = 255, unique = true)
    private String email;

    @Column(name = "PHONE_NUMBER", length = 20, unique = true)
    private String phoneNumber;

    @Column(name = "ADDRESS", length = 500)
    private String address;

    @Column(name = "DATE_OF_BIRTH")
    private LocalDate dateOfBirth;

    @Column(name = "GENDER", length = 10)
    private String gender;

    @Column(name = "IDENTITY_CARD", length = 20, unique = true)
    private String identityCard;

    @Column(name = "IMAGE", length = 500)
    private String image;

    @CreationTimestamp // Tự động lấy thời gian hiện tại khi insert (thay cho sysdate)
    @Column(name = "REGISTER_DATE", updatable = false)
    private LocalDateTime registerDate;

    @Builder.Default
    @Column(name = "STATUS")
    private Integer status = 1; // Default = 1

    // Khóa ngoại liên kết tới bảng ROLES
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROLE_ID", nullable = false)
    private Role role;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;
}