package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.*;
import org.example.be.service.CinemaRoomService;
import org.example.be.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cinema-rooms")
public class CinemaRoomController {

    @Autowired
    private CinemaRoomService cinemaRoomService;

    @Autowired
    private SeatService seatService;

    // AC-01: Lấy danh sách tất cả phòng chiếu
    @GetMapping
    public ResponseEntity<ApiResponse<List<CinemaRoomDTO>>> getAllCinemaRooms() {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách phòng chiếu thành công", cinemaRoomService.getAll())
        );
    }

    // AC-03: Lấy chi tiết một phòng chiếu theo ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CinemaRoomDTO>> getCinemaRoomById(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin phòng chiếu thành công", cinemaRoomService.getById(id))
        );
    }

    // AC-04: Tìm kiếm phòng chiếu theo tên
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CinemaRoomDTO>>> searchCinemaRooms(@RequestParam String keyword) {
        return ResponseEntity.ok(
                ApiResponse.success("Tìm kiếm phòng chiếu thành công", cinemaRoomService.search(keyword))
        );
    }

    // Lấy danh sách phòng chiếu hỗ trợ một định dạng cụ thể (dùng khi tạo suất chiếu)
    @GetMapping("/by-format/{versionId}")
    public ResponseEntity<ApiResponse<List<CinemaRoomDTO>>> getRoomsByFormat(@PathVariable Integer versionId) {
        return ResponseEntity.ok(
                ApiResponse.success("Danh sách phòng theo định dạng", cinemaRoomService.getRoomsByFormat(versionId))
        );
    }

    // AC-02: Tạo phòng chiếu mới kèm seat map
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ResponseEntity<ApiResponse<CinemaRoomDetailDTO>> createCinemaRoom(
            @Valid @RequestBody CreateCinemaRoomRequest request) {
        CinemaRoomDetailDTO created = cinemaRoomService.createCinemaRoom(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo phòng chiếu thành công", created));
    }

    // AC-05: Cập nhật thông tin cơ bản phòng chiếu (tên + formats)
    // KHÔNG đụng đến seat map / capacity
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CinemaRoomDTO>> updateCinemaRoomInfo(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCinemaRoomRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật thông tin phòng chiếu thành công", cinemaRoomService.updateInfo(id, request))
        );
    }

    // AC-06: Ngừng hoạt động (mềm) phòng chiếu (status = INACTIVE)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivateCinemaRoom(@PathVariable Integer id) {
        cinemaRoomService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Ngừng hoạt động phòng chiếu thành công", null));
    }

    // Kích hoạt lại phòng chiếu đã ngừng hoạt động
    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<CinemaRoomDTO>> activateCinemaRoom(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.success("Kích hoạt phòng chiếu thành công", cinemaRoomService.activate(id))
        );
    }

    // ── Seat Map ──────────────────────────────────────────────────────────────

    // Lấy chi tiết phòng + danh sách ghế
    @GetMapping("/{id}/seats")
    public ResponseEntity<ApiResponse<CinemaRoomDetailDTO>> getCinemaRoomDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(
                ApiResponse.success("Lấy thông tin phòng chiếu thành công", seatService.getCinemaRoomDetail(id))
        );
    }

    // Cập nhật loại ghế / trạng thái ghế cho các ghế đã chọn
    @PutMapping("/{id}/seats")
    public ResponseEntity<ApiResponse<String>> updateSeatTypes(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSeatTypeRequest request) {
        request.setCinemaRoomId(id);
        seatService.updateSeatTypes(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật loại ghế thành công", "Cập nhật loại ghế thành công"));
    }

    // AC-NEW: Tái tạo sơ đồ ghế (rows × columns, capacity tự tính)
    // Validate: không thu nhỏ nếu còn booking active
    @PutMapping("/{id}/recreate-seats")
    public ResponseEntity<ApiResponse<CinemaRoomDetailDTO>> recreateSeatMap(
            @PathVariable Integer id,
            @Valid @RequestBody RecreateSeatMapRequest request) {
        CinemaRoomDetailDTO result = seatService.recreateSeatMap(id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Tái tạo sơ đồ ghế thành công", result)
        );
    }
}