package org.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.be.enums.SupportRequestStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "SUPPORT_REQUEST")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SUPPORT_REQUEST_ID")
    private Long supportRequestId;

    @Column(name = "FULL_NAME", length = 120, nullable = false)
    private String fullName;

    @Column(name = "EMAIL", length = 150, nullable = false)
    private String email;

    @Column(name = "PHONE", length = 20)
    private String phone;

    @Column(name = "SUBJECT", length = 200, nullable = false)
    private String subject;

    @Column(name = "MESSAGE", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    private SupportRequestStatus status = SupportRequestStatus.NEW;

    @Column(name = "ADMIN_NOTE", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = SupportRequestStatus.NEW;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
