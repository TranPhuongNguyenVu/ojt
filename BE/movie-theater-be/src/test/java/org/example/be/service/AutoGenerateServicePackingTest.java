package org.example.be.service;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AutoGenerateServicePackingTest {

    private AutoGenerateService.MovieConfig movie(String id, int runtime) {
        AutoGenerateService.MovieConfig mc = new AutoGenerateService.MovieConfig();
        mc.movieId = id;
        mc.runtime = runtime;
        return mc;
    }

    @Test
    void roundUpToStepIsNoOpWhenAlreadyAligned() {
        assertEquals(0, AutoGenerateService.roundUpToStep(0, 5));
        assertEquals(5, AutoGenerateService.roundUpToStep(5, 5));
        assertEquals(1080, AutoGenerateService.roundUpToStep(1080, 5));
    }

    @Test
    void roundUpToStepRoundsUpToNextMultiple() {
        assertEquals(5, AutoGenerateService.roundUpToStep(1, 5));
        assertEquals(10, AutoGenerateService.roundUpToStep(6, 5));
        assertEquals(1085, AutoGenerateService.roundUpToStep(1081, 5));
    }

    /**
     * Reproduces the 2026-07-17 dataset bug: a 2D/3D room (8:00-23:00, golden hour
     * 18:00-21:00) packing 4 shows/day used to leave a multi-hour gap between the
     * last pre-golden show and the post-golden show because counts were split
     * across separate golden/normal windows. Packing continuously must not leave
     * any gap larger than the cleanup buffer (plus rounding slack).
     */
    @Test
    void continuousPackingLeavesNoAbnormalGapAcrossGoldenHour() {
        Map<String, AutoGenerateService.MovieConfig> movieById = new LinkedHashMap<>();
        movieById.put("m1", movie("m1", 100));
        movieById.put("m2", movie("m2", 112));

        List<String> seq = Arrays.asList("m1", "m2", "m1", "m2");
        int openMin = 8 * 60;
        int closeMin = 23 * 60;
        int gapCleanup = 30;

        List<AutoGenerateService.PlacedEvent> events =
                AutoGenerateService.placeContinuously(seq, openMin, closeMin, gapCleanup, movieById);

        assertEquals(4, events.size(), "all 4 shows should fit in a 15-hour window");
        for (AutoGenerateService.PlacedEvent e : events) {
            assertEquals(0, e.startMin % 5, "start time must land on a 5-minute mark: " + e.startMin);
        }
        for (int i = 1; i < events.size(); i++) {
            AutoGenerateService.PlacedEvent prev = events.get(i - 1);
            AutoGenerateService.PlacedEvent curr = events.get(i);
            int gap = curr.startMin - (prev.startMin + prev.durMin);
            assertTrue(gap >= gapCleanup && gap <= gapCleanup + 5,
                    "gap between show " + (i - 1) + " and " + i + " should be ~" + gapCleanup + " min, was " + gap);
        }
    }

    @Test
    void sameMovieNeverOverlapsAcrossRooms() {
        Map<String, AutoGenerateService.MovieConfig> movieById = new LinkedHashMap<>();
        movieById.put("m1", movie("m1", 100));
        movieById.put("m2", movie("m2", 90));

        Map<String, List<int[]>> movieBusy = new HashMap<>();
        List<String> seq = Arrays.asList("m1", "m2", "m1", "m2");

        List<AutoGenerateService.PlacedEvent> room1 =
                AutoGenerateService.placeContinuously(seq, 8 * 60, 23 * 60, 30, movieById, movieBusy);
        List<AutoGenerateService.PlacedEvent> room2 =
                AutoGenerateService.placeContinuously(seq, 8 * 60, 23 * 60, 30, movieById, movieBusy);

        List<AutoGenerateService.PlacedEvent> all = new ArrayList<>(room1);
        all.addAll(room2);
        for (int i = 0; i < all.size(); i++) {
            for (int j = i + 1; j < all.size(); j++) {
                AutoGenerateService.PlacedEvent a = all.get(i);
                AutoGenerateService.PlacedEvent b = all.get(j);
                if (!a.movieId.equals(b.movieId)) continue;
                boolean overlaps = a.startMin < b.startMin + b.durMin && a.startMin + a.durMin > b.startMin;
                assertTrue(!overlaps, "same movie " + a.movieId + " overlaps: " + a.startMin + " vs " + b.startMin);
            }
        }
        assertEquals(4, room1.size(), "room 1 keeps all its shows");
        assertEquals(4, room2.size(), "room 2 shifts shows instead of dropping them");
    }

    @Test
    void placementSkipsPastSeededBusyIntervalsOfSameMovie() {
        Map<String, AutoGenerateService.MovieConfig> movieById = new LinkedHashMap<>();
        movieById.put("m1", movie("m1", 100));

        Map<String, List<int[]>> movieBusy = new HashMap<>();
        movieBusy.put("m1", new ArrayList<>(List.of(new int[]{8 * 60, 8 * 60 + 100})));

        List<AutoGenerateService.PlacedEvent> events =
                AutoGenerateService.placeContinuously(List.of("m1"), 8 * 60, 23 * 60, 30, movieById, movieBusy);

        assertEquals(1, events.size());
        assertTrue(events.get(0).startMin >= 8 * 60 + 100,
                "show must start after the existing showtime of the same movie, was " + events.get(0).startMin);
    }

    @Test
    void continuousPackingStopsWithoutOverflowingWindowEnd() {
        Map<String, AutoGenerateService.MovieConfig> movieById = new LinkedHashMap<>();
        movieById.put("m1", movie("m1", 150));

        List<String> seq = Arrays.asList("m1", "m1", "m1", "m1", "m1", "m1", "m1", "m1");
        List<AutoGenerateService.PlacedEvent> events =
                AutoGenerateService.placeContinuously(seq, 8 * 60, 23 * 60, 30, movieById);

        assertTrue(events.size() < seq.size(), "should stop once the window is exhausted rather than overflow");
        for (AutoGenerateService.PlacedEvent e : events) {
            assertTrue(e.startMin + e.durMin <= 23 * 60, "no event may run past the close time");
        }
    }
}
