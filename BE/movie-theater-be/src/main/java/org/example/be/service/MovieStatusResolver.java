package org.example.be.service;

import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;

@Component
public class MovieStatusResolver {

    private final Clock clock;

    public MovieStatusResolver(Clock clock) {
        this.clock = clock;
    }

    public MovieStatus resolve(Movie movie) {
        if (movie.getStatus() == MovieStatus.DELETED) {
            return MovieStatus.DELETED;
        }

        LocalDate fromDate = movie.getFromDate();
        LocalDate toDate = movie.getToDate();
        if (fromDate == null && toDate == null) {
            return MovieStatus.INACTIVE;
        }

        LocalDate today = LocalDate.now(clock);
        if (today.isAfter(toDate)) {
            return MovieStatus.ENDED;
        }
        if (fromDate.isAfter(today)) {
            return MovieStatus.UPCOMING;
        }
        return MovieStatus.SHOWING;
    }
}
