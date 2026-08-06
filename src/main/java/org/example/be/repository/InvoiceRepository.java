package org.example.be.repository;

import org.example.be.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByAccountIdOrderByInvoiceIdDesc(String accountId);
    List<Invoice> findByScheduleIdAndStatusAndBookingDateBefore(Integer scheduleId, Integer status, java.time.LocalDateTime bookingDate);
    List<Invoice> findByStatusAndBookingDateBefore(Integer status, java.time.LocalDateTime bookingDate);
}
