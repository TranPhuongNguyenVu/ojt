package org.example.be.service;

import org.example.be.entity.Movie;
import org.example.be.enums.MovieStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MovieStatusResolverTest {

    private static final ZoneId ZONE = ZoneOffset.UTC;
    private static final LocalDate TODAY = LocalDate.of(2026, 7, 16);
    private static final Clock CLOCK = Clock.fixed(
            TODAY.atTime(10, 0).toInstant(ZoneOffset.UTC), ZONE);

    private final MovieStatusResolver resolver = new MovieStatusResolver(CLOCK);

    private Movie movie(LocalDate fromDate, LocalDate toDate) {
        return Movie.builder().movieId("m1").fromDate(fromDate).toDate(toDate).build();
    }

    private Movie movie(LocalDate fromDate, LocalDate toDate, MovieStatus status) {
        return Movie.builder().movieId("m1").fromDate(fromDate).toDate(toDate).status(status).build();
    }

    @Test
    void noDatesIsInactive() {
        Movie movie = movie(null, null);
        assertEquals(MovieStatus.INACTIVE, resolver.resolve(movie));
    }

    @Test
    void fromDateInFutureIsUpcoming() {
        Movie movie = movie(TODAY.plusDays(1), TODAY.plusDays(30));
        assertEquals(MovieStatus.UPCOMING, resolver.resolve(movie));
    }

    @Test
    void fromDateTodayIsShowing() {
        Movie movie = movie(TODAY, TODAY.plusDays(10));
        assertEquals(MovieStatus.SHOWING, resolver.resolve(movie));
    }

    @Test
    void withinRangeIsShowing() {
        Movie movie = movie(TODAY.minusDays(5), TODAY.plusDays(5));
        assertEquals(MovieStatus.SHOWING, resolver.resolve(movie));
    }

    @Test
    void toDateTodayIsShowingInclusive() {
        Movie movie = movie(TODAY.minusDays(10), TODAY);
        assertEquals(MovieStatus.SHOWING, resolver.resolve(movie));
    }

    @Test
    void toDateInPastIsEnded() {
        Movie movie = movie(TODAY.minusDays(20), TODAY.minusDays(1));
        assertEquals(MovieStatus.ENDED, resolver.resolve(movie));
    }

    @Test
    void deletedStatusWinsRegardlessOfDates() {
        Movie movie = movie(TODAY.minusDays(1), TODAY.plusDays(10), MovieStatus.DELETED);
        assertEquals(MovieStatus.DELETED, resolver.resolve(movie));
    }

    @Test
    void restoredWithoutDatesIsInactive() {
        Movie movie = movie(null, null, null);
        assertEquals(MovieStatus.INACTIVE, resolver.resolve(movie));
    }

    @Test
    void restoredWithFutureDatesIsUpcoming() {
        Movie movie = movie(TODAY.plusDays(2), TODAY.plusDays(10), null);
        assertEquals(MovieStatus.UPCOMING, resolver.resolve(movie));
    }
}
