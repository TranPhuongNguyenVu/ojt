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
    /** True if the movie has EVER had a schedule created (any status, including DELETED) — used to gate movie DELETE to movies that were never scheduled. */
    @Query(value = "SELECT count(*) > 0 FROM SCHEDULE WHERE MOVIE_ID = :movieId", nativeQuery = true)
    boolean existsAnyByMovieId(@Param("movieId") String movieId);

    /** True if the movie still has an upcoming, non-cancelled showtime — used to block edits without permanently locking the movie once every schedule has ended. */
    @Query("SELECT COUNT(s) > 0 FROM Schedule s WHERE s.movieId = :movieId " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.CANCELLED, org.example.be.enums.ScheduleStatus.DELETED) " +
            "AND s.endTime > :now")
    boolean existsUpcomingByMovieId(@Param("movieId") String movieId, @Param("now") java.time.LocalDateTime now);

    /** Schedules selectable for booking (movie showtime picker) — excludes CANCELLED/DELETED. */
    @Query("SELECT s FROM Schedule s LEFT JOIN FETCH s.cinemaRoom WHERE s.movieId = :movieId " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.CANCELLED, org.example.be.enums.ScheduleStatus.DELETED)")
    List<Schedule> findByMovieId(@Param("movieId") String movieId);

    @Query("SELECT s FROM Schedule s LEFT JOIN FETCH s.cinemaRoom WHERE s.cinemaRoomId = :cinemaRoomId")
    List<Schedule> findByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId);

    /** True if the room still has an upcoming, non-cancelled showtime — used to block edits without permanently locking the room once every schedule has ended. */
    @Query("SELECT COUNT(s) > 0 FROM Schedule s WHERE s.cinemaRoomId = :cinemaRoomId " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.CANCELLED, org.example.be.enums.ScheduleStatus.DELETED) " +
            "AND s.endTime > :now")
    boolean existsUpcomingByCinemaRoomId(@Param("cinemaRoomId") Integer cinemaRoomId, @Param("now") java.time.LocalDateTime now);

    /** Schedules still relevant to a movie (i.e. not soft-deleted) — used for movie overlap validation. */
    @Query("SELECT s FROM Schedule s WHERE s.movieId = :movieId AND s.status <> org.example.be.enums.ScheduleStatus.DELETED")
    List<Schedule> findActiveByMovieId(@Param("movieId") String movieId);

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

    /** Ids of movies that have at least one future, non-cancelled/deleted showtime — used to hide movies with no bookable showtime. */
    @Query("SELECT DISTINCT s.movieId FROM Schedule s WHERE s.startTime > :now " +
            "AND s.status NOT IN (org.example.be.enums.ScheduleStatus.DELETED, org.example.be.enums.ScheduleStatus.CANCELLED)")
    List<String> findDistinctMovieIdsWithFutureSchedules(@Param("now") java.time.LocalDateTime now);
}
