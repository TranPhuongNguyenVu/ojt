package org.example.be.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.example.be.dto.MovieRequestDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MovieDateRangeValidatorTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private MovieRequestDTO.MovieRequestDTOBuilder validBase() {
        return MovieRequestDTO.builder()
                .movieNameEnglish("Movie")
                .movieNameVn("Phim")
                .duration(120)
                .trailer("https://youtube.com/watch?v=1")
                .largeImage("https://img/large.png")
                .smallImage("https://img/small.png")
                .typeIds(List.of(1))
                .versionIds(List.of(1));
    }

    @Test
    void bothDatesNullIsValid() {
        MovieRequestDTO dto = validBase().fromDate(null).toDate(null).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty());
    }

    @Test
    void onlyFromDateIsInvalid() {
        MovieRequestDTO dto = validBase().fromDate(LocalDate.now()).toDate(null).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertEquals(1, violations.size());
        assertEquals("toDate", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void onlyToDateIsInvalid() {
        MovieRequestDTO dto = validBase().fromDate(null).toDate(LocalDate.now()).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertEquals(1, violations.size());
        assertEquals("fromDate", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void toDateBeforeFromDateIsInvalid() {
        LocalDate from = LocalDate.now();
        MovieRequestDTO dto = validBase().fromDate(from).toDate(from.minusDays(1)).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertEquals(1, violations.size());
        assertEquals("toDate", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    void toDateEqualsFromDateIsValid() {
        LocalDate from = LocalDate.now();
        MovieRequestDTO dto = validBase().fromDate(from).toDate(from).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty());
    }

    @Test
    void toDateAfterFromDateIsValid() {
        LocalDate from = LocalDate.now();
        MovieRequestDTO dto = validBase().fromDate(from).toDate(from.plusDays(30)).build();
        Set<ConstraintViolation<MovieRequestDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty());
    }
}
