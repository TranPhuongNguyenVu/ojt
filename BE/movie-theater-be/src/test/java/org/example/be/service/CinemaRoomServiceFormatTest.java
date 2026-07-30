package org.example.be.service;

import org.example.be.entity.Version;
import org.example.be.exception.GlobalExceptionHandler.InvalidFormatCombinationException;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CinemaRoomServiceFormatTest {

    private static final Version TWO_D = Version.builder().versionId(1).versionName("2D").build();
    private static final Version THREE_D = Version.builder().versionId(2).versionName("3D").build();
    private static final Version IMAX = Version.builder().versionId(3).versionName("IMAX").build();
    private static final Version FOUR_DX = Version.builder().versionId(4).versionName("4DX").build();

    private Set<Version> formats(Version... versions) {
        return new HashSet<>(Arrays.asList(versions));
    }

    @Test
    void acceptsTwoDimensionAlone() {
        assertDoesNotThrow(() -> CinemaRoomService.validateFormatCombination(formats(TWO_D)));
    }

    @Test
    void acceptsThreeDimensionAlone() {
        assertDoesNotThrow(() -> CinemaRoomService.validateFormatCombination(formats(THREE_D)));
    }

    @Test
    void acceptsTwoDimensionAndThreeDimensionTogether() {
        assertDoesNotThrow(() -> CinemaRoomService.validateFormatCombination(formats(TWO_D, THREE_D)));
    }

    @Test
    void acceptsImaxAlone() {
        assertDoesNotThrow(() -> CinemaRoomService.validateFormatCombination(formats(IMAX)));
    }

    @Test
    void rejectsImaxCombinedWithTwoDimension() {
        InvalidFormatCombinationException ex = assertThrows(
                InvalidFormatCombinationException.class,
                () -> CinemaRoomService.validateFormatCombination(formats(IMAX, TWO_D)));
        assertEquals(CinemaRoomService.INVALID_FORMAT_COMBINATION_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsImaxCombinedWithFourDx() {
        InvalidFormatCombinationException ex = assertThrows(
                InvalidFormatCombinationException.class,
                () -> CinemaRoomService.validateFormatCombination(formats(IMAX, FOUR_DX)));
        assertEquals(CinemaRoomService.INVALID_FORMAT_COMBINATION_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsEmptySelection() {
        InvalidFormatCombinationException ex = assertThrows(
                InvalidFormatCombinationException.class,
                () -> CinemaRoomService.validateFormatCombination(formats()));
        assertEquals(CinemaRoomService.EMPTY_FORMAT_MESSAGE, ex.getMessage());
    }

    @Test
    void rejectsNullSelection() {
        assertThrows(InvalidFormatCombinationException.class,
                () -> CinemaRoomService.validateFormatCombination(null));
    }

    @Test
    void rejectsTwoDimensionAndThreeDimensionPlusImax() {
        assertThrows(InvalidFormatCombinationException.class,
                () -> CinemaRoomService.validateFormatCombination(formats(TWO_D, THREE_D, IMAX)));
    }
}
