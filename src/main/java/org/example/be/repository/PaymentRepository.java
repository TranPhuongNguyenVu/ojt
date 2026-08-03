package org.example.be.repository;

import org.example.be.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    @Query("""
            SELECT p FROM Payment p
            WHERE p.txnRef LIKE 'EMP-%'
              AND p.paymentStatus = 'SUCCESS'
            ORDER BY p.createdAt DESC, p.paymentId DESC
            """)
    List<Payment> findEmployeeCounterPayments();
}

