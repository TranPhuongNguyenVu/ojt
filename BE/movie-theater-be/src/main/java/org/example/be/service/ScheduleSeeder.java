package org.example.be.service;

import org.example.be.dto.AutoGenerateConfirmRequestDTO;
import org.example.be.dto.AutoGeneratePreviewDTO;
import org.example.be.dto.AutoGenerateRequestDTO;
import org.example.be.dto.ScheduleCandidateDTO;
import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.example.be.entity.Version;
import org.example.be.exception.GlobalExceptionHandler.InvalidFormatCombinationException;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.InvoiceRepository;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.ScheduleSeatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "app.seed-schedules", havingValue = "true")
public class ScheduleSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ScheduleSeeder.class);

    private static final String FORMAT_2D = "2D";
    private static final String FORMAT_3D = "3D";
    private static final String FORMAT_IMAX = "IMAX";
    private static final String FORMAT_4DX = "4DX";

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ScheduleSeatRepository scheduleSeatRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private AutoGenerateService autoGenerateService;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("[ScheduleSeeder] Starting reset + regeneration of schedule data.");

        long invoiceCount = invoiceRepository.count();
        if (invoiceCount > 0) {
            log.error("[ScheduleSeeder] Aborting: {} invoice rows reference existing schedules. "
                    + "Refusing to cascade into booking/payment data.", invoiceCount);
            throw new IllegalStateException(
                    "Reset aborted: existing invoices reference schedules. Manual review required.");
        }

        long scheduleSeatDeleted = scheduleSeatRepository.count();
        long scheduleDeleted = scheduleRepository.count();
        scheduleSeatRepository.deleteAllInBatch();
        scheduleRepository.deleteAllInBatch();
        log.info("[ScheduleSeeder] Deleted {} schedule rows and {} schedule_seat rows.",
                scheduleDeleted, scheduleSeatDeleted);

        RoomRepairResult repair = repairRoomFormats();
        log.info("[ScheduleSeeder] Repaired {} room(s) with invalid format combinations; "
                + "deactivated {} room(s) with no format.", repair.repaired, repair.deactivated);

        AutoGeneratePreviewDTO preview = autoGenerateService.generatePreview(new AutoGenerateRequestDTO());
        log.info("[ScheduleSeeder] Generation produced {} candidate(s): {} accepted, {} rejected.",
                preview.getGeneratedCount(), preview.getAcceptedCount(), preview.getRejectedCount());

        preview.getRejected().forEach(candidate -> log.info(
                "[ScheduleSeeder] Rejected candidate: movie='{}' room='{}' start={} reason={}",
                candidate.getMovieName(), candidate.getCinemaRoomName(),
                candidate.getStartTime(), candidate.getRejectReason()));

        AutoGenerateConfirmRequestDTO confirmRequest = AutoGenerateConfirmRequestDTO.builder()
                .candidates(preview.getAccepted())
                .build();
        int persisted = autoGenerateService.confirm(confirmRequest).getSaved().size();
        log.info("[ScheduleSeeder] Persisted {} validated schedule(s).", persisted);
        log.info("[ScheduleSeeder] Reset + regeneration completed successfully.");
    }

    private RoomRepairResult repairRoomFormats() {
        int repaired = 0;
        int deactivated = 0;
        for (CinemaRoom room : cinemaRoomRepository.findAll()) {
            if (room.getStatus() != CinemaRoomStatus.ACTIVE) {
                continue;
            }
            Set<Version> formats = room.getFormats();
            try {
                CinemaRoomService.validateFormatCombination(formats);
            } catch (InvalidFormatCombinationException ex) {
                Set<Version> corrected = reduceToValidFormats(formats);
                if (corrected.isEmpty()) {
                    room.setStatus(CinemaRoomStatus.INACTIVE);
                    cinemaRoomRepository.save(room);
                    deactivated++;
                    log.info("[ScheduleSeeder] Deactivated room '{}' (id={}): no valid format.",
                            room.getCinemaRoomName(), room.getCinemaRoomId());
                } else {
                    room.setFormats(corrected);
                    cinemaRoomRepository.save(room);
                    repaired++;
                    log.info("[ScheduleSeeder] Repaired room '{}' (id={}) formats to {}.",
                            room.getCinemaRoomName(), room.getCinemaRoomId(),
                            corrected.stream().map(Version::getVersionName).collect(Collectors.toList()));
                }
            }
        }
        return new RoomRepairResult(repaired, deactivated);
    }

    private Set<Version> reduceToValidFormats(Set<Version> formats) {
        Version imax = findByName(formats, FORMAT_IMAX);
        if (imax != null) {
            return new HashSet<>(List.of(imax));
        }
        Version fourDx = findByName(formats, FORMAT_4DX);
        if (fourDx != null) {
            return new HashSet<>(List.of(fourDx));
        }
        Set<Version> twoAndThree = formats.stream()
                .filter(version -> FORMAT_2D.equals(version.getVersionName())
                        || FORMAT_3D.equals(version.getVersionName()))
                .collect(Collectors.toSet());
        return twoAndThree;
    }

    private Version findByName(Set<Version> formats, String name) {
        return formats.stream()
                .filter(version -> name.equals(version.getVersionName()))
                .findFirst()
                .orElse(null);
    }

    private static final class RoomRepairResult {
        private final int repaired;
        private final int deactivated;

        private RoomRepairResult(int repaired, int deactivated) {
            this.repaired = repaired;
            this.deactivated = deactivated;
        }
    }
}
