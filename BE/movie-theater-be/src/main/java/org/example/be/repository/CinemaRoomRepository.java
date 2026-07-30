package org.example.be.repository;

import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CinemaRoomRepository extends JpaRepository<CinemaRoom, Integer> {

    boolean existsByCinemaRoomNameIgnoreCase(String cinemaRoomName);

    Optional<CinemaRoom> findByCinemaRoomName(String cinemaRoomName);

    @Query("SELECT r FROM CinemaRoom r JOIN r.formats f WHERE f.versionId = :versionId AND r.status = :status")
    List<CinemaRoom> findByFormatVersionIdAndStatus(@Param("versionId") Integer versionId,
                                                    @Param("status") CinemaRoomStatus status);
}
