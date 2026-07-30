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
    List<Promotion> findByIsDeletedOrderByStartTimeDesc(Integer isDeleted);

    @Query("""
            select p from Promotion p
            where p.isDeleted = 0
              and (
                :keyword is null
                or lower(p.title) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(p.content, '')) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(p.detail, '')) like lower(concat('%', :keyword, '%'))
              )
            order by p.startTime desc
            """)
    List<Promotion> searchForAdmin(@Param("keyword") String keyword);

    List<Promotion> findByIsDeletedAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            Integer isDeleted,
            PromotionStatus status,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    List<Promotion> findByIsDeletedAndStatusAndEndTimeBefore(
            Integer isDeleted,
            PromotionStatus status,
            LocalDateTime endTime
    );

    java.util.Optional<Promotion> findByTitleIgnoreCaseAndIsDeletedAndStatus(
            String title,
            Integer isDeleted,
            PromotionStatus status
    );
}
