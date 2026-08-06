package org.example.be.repository;

import org.example.be.entity.SupportRequest;
import org.example.be.enums.SupportRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {
    List<SupportRequest> findAllByOrderByCreatedAtDesc();

    List<SupportRequest> findByStatusOrderByCreatedAtDesc(SupportRequestStatus status);

    long countByStatus(SupportRequestStatus status);
}
