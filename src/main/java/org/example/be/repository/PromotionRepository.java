package org.example.be.repository;

import org.example.be.entity.Promotion;
import org.example.be.enums.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    List<Promotion> findByStatusNotOrderByStartTimeDesc(PromotionStatus excludedStatus);

    List<Promotion> findAllByOrderByStartTimeDesc();

    @Query("""
            select p from Promotion p
            where :keyword is null
              or lower(p.title) like lower(concat('%', :keyword, '%'))
              or lower(coalesce(p.content, '')) like lower(concat('%', :keyword, '%'))
              or lower(coalesce(p.detail, '')) like lower(concat('%', :keyword, '%'))
            order by p.startTime desc
            """)
    List<Promotion> searchAllStatusesForAdmin(@Param("keyword") String keyword);

    @Query("""
            select p from Promotion p
            where p.status <> org.example.be.enums.PromotionStatus.DELETED
              and (
                :keyword is null
                or lower(p.title) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(p.content, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(p.detail, '')) like lower(concat('%', :keyword, '%'))
              )
            order by p.startTime desc
            """)
    List<Promotion> searchForAdmin(@Param("keyword") String keyword);

    List<Promotion> findByStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            PromotionStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    List<Promotion> findByStatusAndEndTimeBefore(
            PromotionStatus status,
            LocalDateTime endTime
    );

    java.util.Optional<Promotion> findByTitleIgnoreCaseAndStatus(
            String title,
            PromotionStatus status
    );
}
