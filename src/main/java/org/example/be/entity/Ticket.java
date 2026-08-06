package org.example.be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.enums.TicketStatus;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "TICKET")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TICKET_ID")
    private Integer ticketId;

    @Column(name = "INVOICE_ID", unique = true, nullable = false)
    private Integer invoiceId;

    @Column(name = "TICKET_CODE", length = 16, unique = true, nullable = false)
    private String ticketCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", length = 20, nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.BOOKED;

    @Column(name = "CREATED_BY", length = 36)
    private String createdBy;

    @Column(name = "CHECKED_IN_AT")
    private LocalDateTime checkedInAt;

    @Column(name = "CHECKED_IN_BY")
    private String checkedInBy;

    @Column(name = "CANCELLED_AT")
    private LocalDateTime cancelledAt;

    @Column(name = "CANCELLED_BY", length = 36)
    private String cancelledBy;

    @Column(name = "SCORE_REFUNDED")
    @Builder.Default
    private Integer scoreRefunded = 0;

    @Column(name = "EMAIL_SENT_AT")
    private LocalDateTime emailSentAt;

    @CreationTimestamp
    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;
}
