package org.example.be.repository;

import org.example.be.entity.InvoiceConcession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceConcessionRepository extends JpaRepository<InvoiceConcession, Integer> {
    List<InvoiceConcession> findByInvoiceId(Integer invoiceId);
}
