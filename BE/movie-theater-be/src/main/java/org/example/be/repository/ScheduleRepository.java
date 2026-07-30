package org.example.be.repository;

import org.example.be.entity.Schedule;
import org.example.be.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    @Query(value = "SELECT count(*) > 0 FROM SCHEDULE WHERE MOVIE_ID = :movieId AND STATUS <> 'DELETED'", nativeQuery = true)
    boolean existsByMovieId(@Param("movieId") String movieId);

    @Query("SELECT s FROM Schedule s LEFT JOIN FETCH s.cinemaRoom WHERE s.movieId = :movieId")
    List<Schedule> findByMovieId(@Param("movieId") String movieId);

    @Query("SELECT s FROM Schedule s LEFT JOIN FETCH s.cinemaRoom WHERE s.cinemaRoomId = :cinemaRoomId")
    List<Schedule> findByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId);

    boolean existsByMovieIdAndStartTimeAfter(String movieId, java.time.LocalDateTime startTime);

    @Query(value = "SELECT count(*) > 0 FROM SCHEDULE WHERE CINEMA_ROOM_ID = :cinemaRoomId AND STATUS <> 'DELETED'", nativeQuery = true)
    boolean existsByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId);

    /** Schedules still relevant to a movie (i.e. not soft-deleted) — used to block edit/delete of the movie. */
    @Query("SELECT s FROM Schedule s WHERE s.movieId = :movieId AND s.status <> org.example.be.enums.ScheduleStatus.DELETED")
    List<Schedule> findActiveByMovieId(@Param("movieId") String movieId);

    /** Schedules still relevant to a room (i.e. not soft-deleted) — used to block edit/delete of the room. */
    @Query("SELECT s FROM Schedule s WHERE s.cinemaRoomId = :cinemaRoomId AND s.status <> org.example.be.enums.ScheduleStatus.DELETED")
    List<Schedule> findActiveByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId);

    Optional<Schedule> findByScheduleIdAndStatusNotIn(Integer scheduleId, List<ScheduleStatus> statuses);

    @Query("SELECT s FROM Schedule s LEFT JOIN FETCH s.cinemaRoom")
    List<Schedule> findAllWithRoom();

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.versionId = :versionId AND s.startTime > :now " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.DELETED, org.example.be.enums.ScheduleStatus.CANCELLED)")
    long countFutureByVersionId(@Param("versionId") Integer versionId, @Param("now") java.time.LocalDateTime now);

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.cinemaRoomId = :cinemaRoomId AND s.startTime > :now " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.DELETED, org.example.be.enums.ScheduleStatus.CANCELLED)")
    long countFutureByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId, @Param("now") java.time.LocalDateTime now);

    @Query("SELECT s FROM Schedule s WHERE s.startTime > :now " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.DELETED, org.example.be.enums.ScheduleStatus.CANCELLED)")
    List<Schedule> findFutureActive(@Param("now") java.time.LocalDateTime now);

    @Query("SELECT s FROM Schedule s WHERE s.startTime >= :from AND s.startTime < :to " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.DELETED, org.example.be.enums.ScheduleStatus.CANCELLED)")
    List<Schedule> findActiveBetween(@Param("from") java.time.LocalDateTime from,
                                     @Param("to") java.time.LocalDateTime to);
}
