package org.example.be.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.example.be.dto.AutoGenerateConfirmRequestDTO;
import org.example.be.dto.AutoGeneratePreviewDTO;
import org.example.be.dto.AutoGenerateRequestDTO;
import org.example.be.dto.CreateCinemaRoomRequest;
import org.example.be.dto.SeatCreateItem;
import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.rebuild-all", havingValue = "true")
public class DataRebuildSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataRebuildSeeder.class);

    private static final int VERSION_2D = 1;
    private static final int VERSION_3D = 2;
    private static final int VERSION_IMAX = 3;
    private static final int VERSION_4DX = 4;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private CinemaRoomService cinemaRoomService;

    @Autowired
    private AutoGenerateService autoGenerateService;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[DataRebuildSeeder] Starting full rebuild of cinema rooms + schedules.");

        long invoiceCount = invoiceRepository.count();
        if (invoiceCount > 0) {
            log.error("[DataRebuildSeeder] Aborting: {} invoice rows exist. "
                    + "Refusing to wipe rooms/schedules referenced by bookings.", invoiceCount);
            throw new IllegalStateException(
                    "Rebuild aborted: existing invoices reference schedules. Manual review required.");
        }

        wipeAll();
        resetIdentitySequences();

        List<RoomBlueprint> blueprints = canonicalRooms();
        for (RoomBlueprint blueprint : blueprints) {
            cinemaRoomService.createCinemaRoom(CreateCinemaRoomRequest.builder()
                    .cinemaRoomName(blueprint.name)
                    .rows(blueprint.rows)
                    .columns(blueprint.columns)
                    .formatIds(blueprint.formatIds)
                    .seats(fullGridSeats(blueprint.rows, blueprint.columns))
                    .build());
        }
        log.info("[DataRebuildSeeder] Created {} cinema room(s).", blueprints.size());

        int activated = 0;
        for (CinemaRoom room : cinemaRoomRepository.findAll()) {
            room.setStatus(CinemaRoomStatus.ACTIVE);
            cinemaRoomRepository.save(room);
            activated++;
        }
        log.info("[DataRebuildSeeder] Activated {} cinema room(s).", activated);

        AutoGeneratePreviewDTO preview = autoGenerateService.generatePreview(new AutoGenerateRequestDTO());
        log.info("[DataRebuildSeeder] Generation produced {} candidate(s): {} accepted, {} rejected.",
                preview.getGeneratedCount(), preview.getAcceptedCount(), preview.getRejectedCount());
        preview.getRejected().forEach(candidate -> log.info(
                "[DataRebuildSeeder] Rejected candidate: movie='{}' room='{}' start={} reason={}",
                candidate.getMovieName(), candidate.getCinemaRoomName(),
                candidate.getStartTime(), candidate.getRejectReason()));

        int persisted = autoGenerateService.confirm(AutoGenerateConfirmRequestDTO.builder()
                .candidates(preview.getAccepted())
                .build()).getSaved().size();
        log.info("[DataRebuildSeeder] Persisted {} validated schedule(s).", persisted);
        log.info("[DataRebuildSeeder] Full rebuild completed successfully.");
    }

    private void wipeAll() {
        int scheduleSeat = entityManager.createNativeQuery("DELETE FROM schedule_seat").executeUpdate();
        int schedule = entityManager.createNativeQuery("DELETE FROM schedule").executeUpdate();
        entityManager.createNativeQuery("UPDATE seat SET pair_seat_id = NULL").executeUpdate();
        int seat = entityManager.createNativeQuery("DELETE FROM seat").executeUpdate();
        int roomFormat = entityManager.createNativeQuery("DELETE FROM room_format").executeUpdate();
        int room = entityManager.createNativeQuery("DELETE FROM cinema_room").executeUpdate();
        log.info("[DataRebuildSeeder] Wiped {} schedule, {} schedule_seat, {} seat, {} room_format, {} cinema_room.",
                schedule, scheduleSeat, seat, roomFormat, room);
    }

    private void resetIdentitySequences() {
        entityManager.createNativeQuery(
                "SELECT setval(pg_get_serial_sequence('cinema_room', 'cinema_room_id'), 1, false)").getSingleResult();
        entityManager.createNativeQuery(
                "SELECT setval(pg_get_serial_sequence('seat', 'seat_id'), 1, false)").getSingleResult();
        entityManager.createNativeQuery(
                "SELECT setval(pg_get_serial_sequence('schedule', 'schedule_id'), 1, false)").getSingleResult();
        entityManager.createNativeQuery(
                "SELECT setval(pg_get_serial_sequence('schedule_seat', 'schedule_seat_id'), 1, false)").getSingleResult();
    }

    private List<SeatCreateItem> fullGridSeats(int rows, int columns) {
        List<SeatCreateItem> seats = new ArrayList<>();
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= columns; c++) {
                seats.add(SeatCreateItem.builder()
                        .seatRow(r)
                        .seatColumn(String.valueOf(c))
                        .seatType(SeatService.SEAT_TYPE_NORMAL)
                        .build());
            }
        }
        return seats;
    }

    private List<RoomBlueprint> canonicalRooms() {
        List<RoomBlueprint> rooms = new ArrayList<>();
        rooms.add(new RoomBlueprint("Phòng 1", 8, 10, List.of(VERSION_2D, VERSION_3D)));
        rooms.add(new RoomBlueprint("Phòng 2", 8, 10, List.of(VERSION_2D, VERSION_3D)));
        rooms.add(new RoomBlueprint("Phòng 3", 10, 10, List.of(VERSION_IMAX)));
        rooms.add(new RoomBlueprint("Phòng 4", 6, 8, List.of(VERSION_4DX)));
        rooms.add(new RoomBlueprint("Phòng 5", 8, 10, List.of(VERSION_2D, VERSION_3D)));
        return rooms;
    }

    private static final class RoomBlueprint {
        private final String name;
        private final int rows;
        private final int columns;
        private final List<Integer> formatIds;

        private RoomBlueprint(String name, int rows, int columns, List<Integer> formatIds) {
            this.name = name;
            this.rows = rows;
            this.columns = columns;
            this.formatIds = formatIds;
        }
    }
}
