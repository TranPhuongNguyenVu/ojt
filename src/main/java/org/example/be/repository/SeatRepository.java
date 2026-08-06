package org.example.be.repository;

import org.example.be.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {

    // Lấy tất cả ghế theo phòng chiếu
    List<Seat> findByCinemaRoomId(Integer cinemaRoomId);

    // Lấy tất cả ghế theo phòng chiếu và loại ghế (dùng để cập nhật phụ thu hàng loạt theo loại ghế trong phòng)
    List<Seat> findByCinemaRoomIdAndSeatType(Integer cinemaRoomId, Integer seatType);

    // Lấy ghế theo ID và phòng (để validate khi update)
    Optional<Seat> findBySeatIdAndCinemaRoomId(Integer seatId, Integer cinemaRoomId);

    // Xóa tất cả ghế theo phòng chiếu
    void deleteByCinemaRoomId(Integer cinemaRoomId);

    /**
     * Đếm số ghế thuộc phòng chiếu đang có booking active (hold hoặc đã đặt)
     * trong các suất chiếu sắp tới (end_time > NOW()).
     * Dùng để validate trước khi thu nhỏ sơ đồ ghế.
     *
     * SCHEDULE_SEAT.SEAT_STATUS: 1 = BOOKED, 2 = DRAFT
     */
    @Query(value = """
            SELECT COUNT(DISTINCT ss.seat_id)
            FROM SCHEDULE_SEAT ss
            JOIN SCHEDULE sc ON ss.schedule_id = sc.schedule_id
            JOIN SEAT s ON ss.seat_id = s.seat_id
            WHERE s.cinema_room_id = :cinemaRoomId
              AND sc.end_time > NOW()
              AND ss.seat_status IN (1, 2)
            """, nativeQuery = true)
    long countActiveBookedSeats(@Param("cinemaRoomId") Integer cinemaRoomId);

    /**
     * Kiểm tra một ghế cụ thể có đang được giữ/đặt cho suất chiếu sắp tới không.
     * Dùng để chặn đổi loại/trạng thái ghế đã có booking.
     */
    @Query(value = """
            SELECT COUNT(*) > 0
            FROM SCHEDULE_SEAT ss
            JOIN SCHEDULE sc ON ss.schedule_id = sc.schedule_id
            WHERE ss.seat_id = :seatId
              AND sc.end_time > NOW()
              AND ss.seat_status IN (1, 2)
            """, nativeQuery = true)
    boolean isSeatActivelyBooked(@Param("seatId") Integer seatId);
}
