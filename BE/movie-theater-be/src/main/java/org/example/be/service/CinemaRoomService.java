package org.example.be.service;

import org.example.be.dto.*;
import org.example.be.entity.CinemaRoom;
import org.example.be.enums.CinemaRoomStatus;
import org.example.be.entity.Schedule;
import org.example.be.entity.Seat;
import org.example.be.entity.Version;
import org.example.be.exception.GlobalExceptionHandler.InvalidFormatCombinationException;
import org.example.be.mapper.CinemaRoomMapper;
import org.example.be.repository.CinemaRoomRepository;
import org.example.be.repository.ScheduleRepository;
import org.example.be.repository.VersionRepository;
import org.example.be.util.TextNormalizeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CinemaRoomService {

    public static final String FORMAT_2D = "2D";
    public static final String FORMAT_3D = "3D";

    public static final String EMPTY_FORMAT_MESSAGE =
            "Phòng chiếu phải có ít nhất một định dạng.";
    public static final String INVALID_FORMAT_COMBINATION_MESSAGE =
            "Chỉ có thể chọn đồng thời 2D và 3D. Các định dạng khác phải được chọn riêng lẻ.";

    @Autowired
    private CinemaRoomRepository cinemaRoomRepository;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CinemaRoomMapper cinemaRoomMapper;

    @Autowired
    private SeatService seatService;

    @Autowired
    private ScheduleService scheduleService;

    public List<CinemaRoomDTO> getRoomsByFormat(Integer versionId) {
        return cinemaRoomRepository
                .findByFormatVersionIdAndStatus(versionId, CinemaRoomStatus.ACTIVE).stream()
                .map(cinemaRoomMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<CinemaRoomDTO> getAll() {
        return cinemaRoomRepository.findAll().stream()
                .map(cinemaRoomMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CinemaRoomDTO getById(Integer id) {
        return cinemaRoomMapper.toDTO(findRoomOrThrow(id));
    }

    public List<CinemaRoomDTO> search(String keyword) {
        String needle = TextNormalizeUtil.stripDiacritics(keyword).toLowerCase();
        return cinemaRoomRepository.findAll().stream()
                .filter(room -> TextNormalizeUtil.stripDiacritics(room.getCinemaRoomName())
                        .toLowerCase()
                        .contains(needle))
                .map(cinemaRoomMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public CinemaRoomDetailDTO createCinemaRoom(CreateCinemaRoomRequest request) {
        if (cinemaRoomRepository.existsByCinemaRoomNameIgnoreCase(request.getCinemaRoomName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, CreateCinemaRoomRequest.DUPLICATE_NAME);
        }

        int seatQuantity = request.getRows() * request.getColumns();

        long seatCount = request.getSeats() != null ? request.getSeats().size() : 0;
        if (seatCount > seatQuantity) {
            throw new IllegalArgumentException(
                    "Seat count (" + seatCount + ") exceeds grid size (" + seatQuantity + " cells)."
            );
        }

        Set<String> positionSet = new HashSet<>();
        for (SeatCreateItem item : request.getSeats()) {
            String pos = item.getSeatRow() + "-" + item.getSeatColumn();
            if (!positionSet.add(pos)) {
                throw new IllegalArgumentException(
                        "Duplicate seat position: row " + item.getSeatRow() + ", column " + item.getSeatColumn() + "."
                );
            }
        }

        Set<Version> formats = resolveFormats(request.getFormatIds());

        CinemaRoom savedRoom = cinemaRoomRepository.save(CinemaRoom.builder()
                .cinemaRoomName(request.getCinemaRoomName())
                .seatQuantity(seatQuantity)
                .formats(formats)
                .status(CinemaRoomStatus.INACTIVE)
                .build());

        List<Seat> savedSeats = seatService.createSeatGrid(
                savedRoom.getCinemaRoomId(),
                request.getRows(),
                request.getColumns(),
                request.getSeats());

        return seatService.buildDetail(savedRoom, savedSeats);
    }

    @Transactional(rollbackFor = Exception.class)
    public CinemaRoomDTO updateInfo(Integer id, UpdateCinemaRoomRequest request) {
        CinemaRoom room = findRoomOrThrow(id);

        if (scheduleRepository.existsByCinemaRoomId(id)) {
            throw new IllegalStateException("Không thể cập nhật phòng chiếu đang có lịch chiếu.");
        }

        boolean nameChanged = !room.getCinemaRoomName().equalsIgnoreCase(request.getCinemaRoomName());
        if (nameChanged
                && cinemaRoomRepository.existsByCinemaRoomNameIgnoreCase(request.getCinemaRoomName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, CreateCinemaRoomRequest.DUPLICATE_NAME);
        }

        room.setCinemaRoomName(request.getCinemaRoomName());
        room.setFormats(resolveFormats(request.getFormatIds()));

        return cinemaRoomMapper.toDTO(cinemaRoomRepository.save(room));
    }

    @Transactional(rollbackFor = Exception.class)
    public CinemaRoomDTO activate(Integer id) {
        CinemaRoom room = findRoomOrThrow(id);
        room.setStatus(CinemaRoomStatus.ACTIVE);
        return cinemaRoomMapper.toDTO(cinemaRoomRepository.save(room));
    }

    @Transactional(rollbackFor = Exception.class)
    public CinemaRoomDTO deactivate(Integer id) {
        CinemaRoom room = findRoomOrThrow(id);

        List<Schedule> blocking = scheduleRepository.findActiveByCinemaRoomId(id).stream()
                .filter(s -> !scheduleService.canCancelOrDelete(s))
                .collect(Collectors.toList());
        if (!blocking.isEmpty()) {
            throw new IllegalStateException(
                    "Không thể ngừng hoạt động phòng chiếu: còn suất chiếu trong vòng 2 ngày tới chưa thể hủy.");
        }

        room.setStatus(CinemaRoomStatus.INACTIVE);
        return cinemaRoomMapper.toDTO(cinemaRoomRepository.save(room));
    }

    public static void validateFormatCombination(Set<Version> formats) {
        if (formats == null || formats.isEmpty()) {
            throw new InvalidFormatCombinationException(EMPTY_FORMAT_MESSAGE, List.of());
        }

        List<String> names = formats.stream()
                .map(Version::getVersionName)
                .sorted()
                .collect(Collectors.toList());

        if (names.size() == 1) {
            return;
        }

        boolean isTwoAndThreeDimension = names.size() == 2
                && names.contains(FORMAT_2D)
                && names.contains(FORMAT_3D);

        if (!isTwoAndThreeDimension) {
            throw new InvalidFormatCombinationException(INVALID_FORMAT_COMBINATION_MESSAGE, names);
        }
    }

    private Set<Version> resolveFormats(List<Integer> formatIds) {
        Set<Integer> idSet = formatIds == null ? new HashSet<>() : new HashSet<>(formatIds);
        Set<Version> formats = new HashSet<>();
        for (Integer fid : idSet) {
            formats.add(versionRepository.findById(fid)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Format ID " + fid + " does not exist.")));
        }
        validateFormatCombination(formats);
        return formats;
    }

    private CinemaRoom findRoomOrThrow(Integer id) {
        return cinemaRoomRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cinema room not found."));
    }
}
