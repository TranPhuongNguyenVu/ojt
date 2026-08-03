package org.example.be.repository;

import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {
    List<Movie> findByStatusNot(MovieStatus status);

    List<Movie> findByStatusNotIn(List<MovieStatus> statuses);

    // STATUS để NULL cho phim có trạng thái tính động (UPCOMING/SHOWING/ENDED qua MovieStatusResolver) —
    // "status <> :status" loại bỏ NULL theo SQL 3-valued logic nên cần OR IS NULL để không mất các phim này.
    List<Movie> findByStatusIsNullOrStatusNot(MovieStatus status);
}
