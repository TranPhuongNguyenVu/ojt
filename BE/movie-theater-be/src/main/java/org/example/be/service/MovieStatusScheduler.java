package org.example.be.service;

import lombok.extern.slf4j.Slf4j;
import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.example.be.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Ghi lại STATUS thật vào DB cho các phim chuyển trạng thái (UPCOMING -> SHOWING -> ENDED)
 * chỉ do thời gian trôi qua chứ không do admin sửa phim. addMovie/updateMovie/activateMovie
 * đã tự ghi status ngay khi có thay đổi; job này quét định kỳ để bắt các trường hợp còn lại.
 */
@Component
@Slf4j
public class MovieStatusScheduler {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private MovieStatusResolver movieStatusResolver;

    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        syncMovieStatuses();
    }

    // Ranh giới UPCOMING/SHOWING/ENDED chỉ đổi theo ngày (LocalDate) nên chạy mỗi ngày lúc 00:05 là đủ
    @Scheduled(cron = "0 5 0 * * *")
    public void syncDaily() {
        syncMovieStatuses();
    }

    @Transactional
    public void syncMovieStatuses() {
        List<Movie> candidates = movieRepository.findByStatusIsNullOrStatusNot(MovieStatus.DELETED);
        List<Movie> changed = candidates.stream()
                .filter(movie -> {
                    MovieStatus resolved = movieStatusResolver.resolve(movie);
                    if (movie.getStatus() != resolved) {
                        movie.setStatus(resolved);
                        return true;
                    }
                    return false;
                })
                .collect(Collectors.toList());

        if (!changed.isEmpty()) {
            movieRepository.saveAll(changed);
            log.info("Đồng bộ status theo fromDate/toDate cho {} phim.", changed.size());
        }
    }
}
