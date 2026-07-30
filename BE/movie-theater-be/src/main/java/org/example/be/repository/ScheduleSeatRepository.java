package org.example.be.repository;

import org.example.be.entity.ScheduleSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleSeatRepository extends JpaRepository<ScheduleSeat, Integer> {
    List<ScheduleSeat> findByScheduleId(Integer scheduleId);

    Optional<ScheduleSeat> findByScheduleIdAndSeatId(Integer scheduleId, Integer seatId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ss FROM ScheduleSeat ss WHERE ss.scheduleId = :scheduleId AND ss.seatId = :seatId")
    Optional<ScheduleSeat> findByScheduleIdAndSeatIdForUpdate(
            @Param("scheduleId") Integer scheduleId,
            @Param("seatId") Integer seatId);

    List<ScheduleSeat> findBySeatStatusAndReservedAtBefore(Integer seatStatus, LocalDateTime reservedAt);

    /**
     * Giữ ghế atomic: chỉ thành công nếu ghế trống, DRAFT của chính mình, hoặc DRAFT đã hết hạn.
     * @return số dòng cập nhật (0 = không giữ được)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE ScheduleSeat ss
               SET ss.seatStatus = 2,
                   ss.reservedAt = :now,
                   ss.reservedBy = :accountId
             WHERE ss.scheduleId = :scheduleId
               AND ss.seatId = :seatId
               AND (
                    ss.seatStatus IS NULL
                    OR ss.seatStatus = 0
                    OR (ss.seatStatus = 2 AND ss.reservedBy = :accountId)
                    OR (ss.seatStatus = 2 AND ss.reservedAt < :expiredBefore)
               )
            """)
    int tryHoldSeat(
            @Param("scheduleId") Integer scheduleId,
            @Param("seatId") Integer seatId,
            @Param("accountId") String accountId,
            @Param("now") LocalDateTime now,
            @Param("expiredBefore") LocalDateTime expiredBefore);
}
