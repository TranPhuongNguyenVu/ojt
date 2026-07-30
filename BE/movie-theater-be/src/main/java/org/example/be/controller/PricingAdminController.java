package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.GoldenHourConfigDTO;
import org.example.be.dto.GoldenHourConfigRequestDTO;
import org.example.be.dto.RoomFormatPriceUpdateDTO;
import org.example.be.dto.SeatTypeSurchargeUpdateDTO;
import org.example.be.entity.Version;
import org.example.be.service.PricingConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_Admin')")
public class PricingAdminController {

    @Autowired
    private PricingConfigService pricingConfigService;

    @PatchMapping("/room-formats/{id}")
    public ApiResponse<Version> updateRoomFormatBasePrice(
            @PathVariable Integer id,
            @RequestBody RoomFormatPriceUpdateDTO request,
            @RequestParam(defaultValue = "false") boolean force) {
        Version updated = pricingConfigService.updateRoomFormatBasePrice(id, request.getBasePrice(), force);
        return ApiResponse.success("Cập nhật giá cơ bản thành công", updated);
    }

    @PatchMapping("/room-formats/{versionId}/seat-types/{seatType}/extra-price")
    public ApiResponse<Version> updateSeatTypeSurcharge(
            @PathVariable Integer versionId,
            @PathVariable Integer seatType,
            @RequestBody SeatTypeSurchargeUpdateDTO request,
            @RequestParam(defaultValue = "false") boolean force) {
        Version updated = pricingConfigService.updateSeatTypeSurcharge(versionId, seatType, request.getExtraPrice(), force);
        return ApiResponse.success("Cập nhật phụ thu ghế thành công", updated);
    }

    @GetMapping("/golden-hours")
    public ApiResponse<List<GoldenHourConfigDTO>> getGoldenHours() {
        return ApiResponse.success("Danh sách khung giờ vàng", pricingConfigService.getGoldenHours());
    }

    @PostMapping("/golden-hours")
    public ApiResponse<GoldenHourConfigDTO> createGoldenHour(
            @RequestBody GoldenHourConfigRequestDTO request,
            @RequestParam(defaultValue = "false") boolean force) {
        return ApiResponse.success("Tạo khung giờ vàng thành công", pricingConfigService.createGoldenHour(request, force));
    }

    @PatchMapping("/golden-hours/{id}")
    public ApiResponse<GoldenHourConfigDTO> updateGoldenHour(
            @PathVariable Integer id,
            @RequestBody GoldenHourConfigRequestDTO request,
            @RequestParam(defaultValue = "false") boolean force) {
        return ApiResponse.success("Cập nhật khung giờ vàng thành công", pricingConfigService.updateGoldenHour(id, request, force));
    }

    @DeleteMapping("/golden-hours/{id}")
    public ApiResponse<Void> deleteGoldenHour(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "false") boolean force) {
        pricingConfigService.deleteGoldenHour(id, force);
        return ApiResponse.success("Xóa khung giờ vàng thành công", null);
    }
}
