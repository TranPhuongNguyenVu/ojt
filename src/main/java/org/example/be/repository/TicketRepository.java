package org.example.be.repository;

import org.example.be.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {

    Optional<Ticket> findByTicketCode(String ticketCode);

    Optional<Ticket> findByInvoiceId(Integer invoiceId);

    boolean existsByInvoiceId(Integer invoiceId);

    boolean existsByTicketCode(String ticketCode);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE Ticket t SET t.status = org.example.be.enums.TicketStatus.CHECKED_IN, "
            + "t.checkedInAt = :checkedInAt, t.checkedInBy = :checkedInBy "
            + "WHERE t.ticketCode = :ticketCode AND t.status = org.example.be.enums.TicketStatus.BOOKED")
    int markCheckedIn(@Param("ticketCode") String ticketCode, @Param("checkedInAt") LocalDateTime checkedInAt,
            @Param("checkedInBy") String checkedInBy);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("UPDATE Ticket t SET t.emailSentAt = :sentAt WHERE t.invoiceId = :invoiceId")
    int markEmailSent(@Param("invoiceId") Integer invoiceId, @Param("sentAt") LocalDateTime sentAt);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE TICKET t SET STATUS = 'EXPIRED' "
            + "FROM INVOICE i, SCHEDULE s "
            + "WHERE t.INVOICE_ID = i.INVOICE_ID AND i.SCHEDULE_ID = s.SCHEDULE_ID "
            + "AND t.STATUS = 'BOOKED' AND s.END_TIME < :now", nativeQuery = true)
    int expireValidTicketsForEndedSchedules(@Param("now") LocalDateTime now);
}
