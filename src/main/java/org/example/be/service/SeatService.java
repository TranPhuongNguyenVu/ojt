package org.example.be.service;

import org.example.be.dto.*;
import org.example.be.entity.CinemaRoom;
import org.example.be.entity.Seat;
import org.example.be.entity.Version;
import org.example.be.enums.SeatStatus;
import org.example.be.exception.GlobalExceptionHandler.InvalidCoupleSeatPairException;
import org.example.be.mapper.CinemaRoomMapper;
import org.example.be.mapper.SeatMapper;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.SeatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatService {

    public static final int SEAT_TYPE_NORMAL = 0;
    public static final int SEAT_TYPE_VIP = 1;
    public static final int SEAT_TYPE_COUPLE = 2;

    public static final String VERTICAL_PAIR_MESSAGE =
            "Ghế đôi chỉ được ghép ngang: hai ghế phải cùng một hàng và nằm ở hai cột liền kề.";
    public static final String NOT_ADJACENT_MESSAGE =
            "Ghế đôi phải nằm ở hai cột liền kề trong cùng một hàng.";
    public static final String PARTNER_NOT_FOUND_MESSAGE =
            "Không tìm thấy ghế được ghép đôi trong phòng chiếu này.";
    public static final String PAIR_NOT_MUTUAL_MESSAGE =
            "Hai ghế trong một cặp ghế đôi phải tham chiếu lẫn nhau.";
    public static final String AISLE_SEAT_MESSAGE =
            "Ghế lối đi không thể được ghép đôi.";
    public static final String MISSING_PAIR_MESSAGE =
            "Ghế đôi phải được ghép với một ghế khác.";

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private SeatMapper seatMapper;

    @Autowired
    private CinemaRoomMapper cinemaRoomMapper;

    @Autowired
    private PricingService pricingService;

    public CinemaRoomDetailDTO getCinemaRoomDetail(Integer cinemaRoomId) {
        CinemaRoom room = findRoomOrThrow(cinemaRoomId);
        return buildDetail(room, seatRepository.findByCinemaRoomId(cinemaRoomId));
    }

    @Transactional(rollbackFor = Exception.class)
    public CinemaRoomDetailDTO recreateSeatMap(Integer id, RecreateSeatMapRequest request) {
        CinemaRoom room = findRoomOrThrow(id);

        if (scheduleRepository.existsUpcomingByCinemaRoomId(id, LocalDateTime.now())) {
            throw new IllegalStateException("Không thể cập nhật cấu hình ghế của phòng đang có lịch chiếu.");
        }

        int newCapacity = request.getRows() * request.getColumns();

        long bookedCount = seatRepository.countActiveBookedSeats(id);
        if (newCapacity < bookedCount) {
            throw new IllegalArgumentException(
                    "There are " + bookedCount + " seats currently held or booked for upcoming schedules, " +
                            "please resolve them before shrinking the seat map. " +
                            "(New map: " + newCapacity + " seats)"
            );
        }

        seatRepository.deleteByCinemaRoomId(id);

        List<Seat> newSeats = new ArrayList<>();
        for (int r = 1; r <= request.getRows(); r++) {
            for (int c = 1; c <= request.getColumns(); c++) {
                newSeats.add(Seat.builder()
                        .cinemaRoomId(id)
                        .seatColumn(getColumnLetter(c - 1))
                        .seatRow(r)
                        .seatType(SEAT_TYPE_NORMAL)
                        .status(SeatStatus.ACTIVE)
                        .build());
            }
        }
        List<Seat> savedSeats = seatRepository.saveAll(newSeats);

        room.setSeatQuantity(newCapacity);
        cinemaRoomRepository.save(room);

        return buildDetail(room, savedSeats);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateSeatTypes(UpdateSeatTypeRequest request) {
        CinemaRoom room = findRoomOrThrow(request.getCinemaRoomId());

        if (Boolean.TRUE.equals(request.getRecreate())) {
            if (scheduleRepository.existsUpcomingByCinemaRoomId(request.getCinemaRoomId(), LocalDateTime.now())) {
                throw new IllegalStateException("Không thể cập nhật cấu hình ghế của phòng đang có lịch chiếu.");
            }

            long bookedCount = seatRepository.countActiveBookedSeats(request.getCinemaRoomId());
            int newCapacity = request.getSeats().size();
            if (newCapacity < bookedCount) {
                throw new IllegalArgumentException(
                        "There are " + bookedCount + " seats currently held or booked for upcoming schedules, " +
                                "please resolve them before shrinking the seat map. " +
                                "(New map: " + newCapacity + " seats)"
                );
            }

            seatRepository.deleteByCinemaRoomId(request.getCinemaRoomId());

            List<Seat> newSeats = new ArrayList<>();
            for (SeatUpdateItem item : request.getSeats()) {
                Integer type = item.getSeatType() != null ? item.getSeatType() : SEAT_TYPE_NORMAL;
                newSeats.add(Seat.builder()
                        .cinemaRoomId(request.getCinemaRoomId())
                        .seatColumn(item.getSeatColumn())
                        .seatRow(item.getSeatRow())
                        .seatType(type)
                        .pairSeatId(item.getPairSeatId())
                        .status(item.getStatus() != null ? SeatStatus.valueOf(item.getStatus()) : SeatStatus.ACTIVE)
                        .build());
            }
            seatRepository.saveAll(newSeats);
            return;
        }

        List<Seat> seatsToUpdate = new ArrayList<>();
        for (SeatUpdateItem item : request.getSeats()) {
            Seat seat = seatRepository
                    .findBySeatIdAndCinemaRoomId(item.getSeatId(), request.getCinemaRoomId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Seat ID " + item.getSeatId() + " does not exist in this room."));

            SeatStatus requestedStatus = item.getStatus() != null ? SeatStatus.valueOf(item.getStatus()) : null;
            boolean typeOrStatusChanged = !Objects.equals(seat.getSeatType(), item.getSeatType())
                    || !Objects.equals(seat.getStatus(), requestedStatus);
            boolean pairChanged = !Objects.equals(seat.getPairSeatId(), item.getPairSeatId());

            if ((typeOrStatusChanged || pairChanged) && seatRepository.isSeatActivelyBooked(seat.getSeatId())) {
                throw new IllegalStateException(
                        "Không thể thay đổi ghế " + seat.getSeatRow() + "-" + seat.getSeatColumn()
                                + " vì ghế đã được đặt.");
            }

            seat.setSeatType(item.getSeatType());
            seat.setPairSeatId(item.getPairSeatId());
            seat.setStatus(requestedStatus != null ? requestedStatus : SeatStatus.ACTIVE);
            seatsToUpdate.add(seat);
        }

        validateCouplePairs(resolveFinalSeatMap(request.getCinemaRoomId(), seatsToUpdate));

        seatRepository.saveAll(seatsToUpdate);
    }

    @Transactional(rollbackFor = Exception.class)
    public List<Seat> createSeatGrid(Integer cinemaRoomId, int rows, int columns, List<SeatCreateItem> requestSeats) {
        Map<String, SeatCreateItem> requestSeatsMap = new HashMap<>();
        for (SeatCreateItem item : requestSeats) {
            requestSeatsMap.put(item.getSeatRow() + "-" + item.getSeatColumn(), item);
        }

        List<Seat> seatsToSave = new ArrayList<>();
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= columns; c++) {
                String colLetter = getColumnLetter(c - 1);
                SeatCreateItem requestSeat = requestSeatsMap.get(r + "-" + colLetter);

                seatsToSave.add(Seat.builder()
                        .cinemaRoomId(cinemaRoomId)
                        .seatColumn(colLetter)
                        .seatRow(r)
                        .seatType(requestSeat != null ? requestSeat.getSeatType() : SEAT_TYPE_NORMAL)
                        .status(requestSeat != null ? SeatStatus.ACTIVE : SeatStatus.AISLE)
                        .build());
            }
        }

        return seatRepository.saveAll(seatsToSave);
    }

    public CinemaRoomDetailDTO buildDetail(CinemaRoom room, List<Seat> seats) {
        List<Version> formats = room.getFormats().stream()
                .sorted(Comparator.comparing(Version::getVersionId))
                .collect(Collectors.toList());

        List<SeatDTO> seatDTOs = seats.stream()
                .map(seat -> {
                    SeatDTO dto = seatMapper.toDTO(seat);
                    dto.setPrices(formats.stream()
                            .map(version -> SeatFormatPriceDTO.builder()
                                    .versionId(version.getVersionId())
                                    .versionName(version.getVersionName())
                                    .price(pricingService.calculateSeatFormatPrice(version, seat))
                                    .build())
                            .collect(Collectors.toList()));
                    return dto;
                })
                .collect(Collectors.toList());

        return CinemaRoomDetailDTO.builder()
                .cinemaRoomId(room.getCinemaRoomId())
                .cinemaRoomName(room.getCinemaRoomName())
                .seatQuantity(room.getSeatQuantity())
                .formats(cinemaRoomMapper.formatSetToDto(room.getFormats()))
                .seats(seatDTOs)
                .status(room.getStatus() != null ? room.getStatus().name() : null)
                .build();
    }

    public static void validateCouplePairs(List<Seat> seats) {
        Map<Integer, Seat> seatsById = new HashMap<>();
        for (Seat seat : seats) {
            if (seat.getSeatId() != null) {
                seatsById.put(seat.getSeatId(), seat);
            }
        }

        for (Seat seat : seats) {
            boolean isCoupleType = seat.getSeatType() != null && seat.getSeatType() == SEAT_TYPE_COUPLE;
            boolean hasPartner = seat.getPairSeatId() != null;

            if (!isCoupleType && !hasPartner) {
                continue;
            }

            if (isCoupleType != hasPartner) {
                throw new InvalidCoupleSeatPairException(
                        MISSING_PAIR_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }

            Seat partner = seatsById.get(seat.getPairSeatId());
            if (partner == null) {
                throw new InvalidCoupleSeatPairException(
                        PARTNER_NOT_FOUND_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }

            if (!seat.getSeatId().equals(partner.getPairSeatId())
                    || partner.getSeatType() == null
                    || partner.getSeatType() != SEAT_TYPE_COUPLE) {
                throw new InvalidCoupleSeatPairException(
                        PAIR_NOT_MUTUAL_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }

            if (isAisle(seat) || isAisle(partner)) {
                throw new InvalidCoupleSeatPairException(
                        AISLE_SEAT_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }

            if (!Objects.equals(seat.getSeatRow(), partner.getSeatRow())) {
                throw new InvalidCoupleSeatPairException(
                        VERTICAL_PAIR_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }

            if (Math.abs(columnIndexOf(seat) - columnIndexOf(partner)) != 1) {
                throw new InvalidCoupleSeatPairException(
                        NOT_ADJACENT_MESSAGE, seat.getSeatId(), seat.getPairSeatId());
            }
        }
    }

    private List<Seat> resolveFinalSeatMap(Integer cinemaRoomId, List<Seat> updatedSeats) {
        Map<Integer, Seat> finalSeats = new LinkedHashMap<>();
        for (Seat seat : seatRepository.findByCinemaRoomId(cinemaRoomId)) {
            finalSeats.put(seat.getSeatId(), seat);
        }
        for (Seat seat : updatedSeats) {
            finalSeats.put(seat.getSeatId(), seat);
        }
        return new ArrayList<>(finalSeats.values());
    }

    private CinemaRoom findRoomOrThrow(Integer id) {
        return cinemaRoomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cinema room not found."));
    }

    private static boolean isAisle(Seat seat) {
        return seat.getStatus() == SeatStatus.AISLE;
    }

    private static int columnIndexOf(Seat seat) {
        String column = seat.getSeatColumn();
        if (column == null || column.isBlank()) {
            return -1;
        }
        String normalized = column.trim().toUpperCase();
        try {
            return Integer.parseInt(normalized) - 1;
        } catch (NumberFormatException ignored) {
            int index = 0;
            for (int i = 0; i < normalized.length(); i++) {
                index = index * 26 + (normalized.charAt(i) - 'A' + 1);
            }
            return index - 1;
        }
    }

    static String getColumnLetter(int index) {
        return String.valueOf(index + 1);
    }
}
