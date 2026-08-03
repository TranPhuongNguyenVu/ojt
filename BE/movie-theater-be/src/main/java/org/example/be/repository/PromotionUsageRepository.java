package org.example.be.repository;

import org.example.be.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Integer> {
    boolean existsByPromotionIdAndCustomerId(Integer promotionId, String customerId);

    boolean existsByInvoiceId(Integer invoiceId);
}
