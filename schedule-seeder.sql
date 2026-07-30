-- SeedSchedules.sql
-- This script clears existing schedules and seeds 20 random showtimes for the first 4 movies.

-- Clear existing schedules
DELETE FROM SCHEDULE_SEAT;
DELETE FROM SCHEDULE;

-- Seed 20 random schedules
DO $$
DECLARE
    movie_ids VARCHAR(36)[] := ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004'];
    movie_durations INT[] := ARRAY[148, 169, 100, 112];
    i INT;
    m_idx INT;
    curr_room INT;
    start_time TIMESTAMP;
    dur INT;
BEGIN
    FOR i IN 1..20 LOOP
        m_idx := floor(random() * 4) + 1;
        curr_room := floor(random() * 3) + 1;
        -- Start time: Tomorrow + 0-6 days + 10:00 to 22:00
        start_time := (CURRENT_DATE + INTERVAL '1 day' + (floor(random() * 7) * INTERVAL '1 day') + (floor(random() * 12 + 10) || ' hours')::INTERVAL);
        dur := movie_durations[m_idx];

        INSERT INTO SCHEDULE (MOVIE_ID, CINEMA_ROOM_ID, START_TIME, END_TIME, PRICE_BASE, BUFFER_TIME)
        VALUES (
            movie_ids[m_idx],
            curr_room,
            start_time,
            start_time + (dur || ' minutes')::INTERVAL,
            80000 + (floor(random() * 5) * 10000),
            30
        );
    END LOOP;
END $$;
