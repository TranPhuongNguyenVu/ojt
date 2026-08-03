package org.example.be.repository;

import org.example.be.entity.InvoiceSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceSeatRepository extends JpaRepository<InvoiceSeat, Integer> {
    List<InvoiceSeat> findByInvoiceId(Integer invoiceId);
    List<InvoiceSeat> findByScheduleSeatId(Integer scheduleSeatId);
}
