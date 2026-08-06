package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.FoodDTO;
import org.example.be.dto.FoodRequestDTO;
import org.example.be.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class FoodController {
    @Autowired
    private FoodService foodService;

    @GetMapping("/api/foods")
    public ApiResponse<List<FoodDTO>> getAllFoods() {
        return ApiResponse.success("List of foods", foodService.getAll(false));
    }

    @GetMapping("/api/foods/search")
    public ApiResponse<List<FoodDTO>> searchFoods(@RequestParam String keyword) {
        return ApiResponse.success("Search results", foodService.search(keyword, false));
    }

    @GetMapping("/api/foods/{id}")
    public ApiResponse<FoodDTO> getFoodById(@PathVariable Integer id) {
        return ApiResponse.success("Food details", foodService.getPublicById(id));
    }

    @PostMapping("/api/foods")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> createFood(@Valid @RequestBody FoodRequestDTO requestDTO) {
        return ApiResponse.success("Food created", foodService.create(requestDTO));
    }

    @PutMapping("/api/foods/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> updateFood(@PathVariable Integer id, @Valid @RequestBody FoodRequestDTO requestDTO) {
        return ApiResponse.success("Food updated", foodService.update(id, requestDTO));
    }

    @PatchMapping("/api/foods/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> activateFood(@PathVariable Integer id) {
        return ApiResponse.success("Food restored", foodService.activate(id));
    }

    @DeleteMapping("/api/foods/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> deleteFood(@PathVariable Integer id) {
        return ApiResponse.success("Food deleted", foodService.delete(id));
    }

    @GetMapping("/api/admin/foods")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<FoodDTO>> getAllFoodsAdmin() {
        return ApiResponse.success("List of foods", foodService.getAll(true));
    }

    @GetMapping("/api/admin/foods/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<FoodDTO>> searchFoodsAdmin(@RequestParam String keyword) {
        return ApiResponse.success("Search results", foodService.search(keyword, true));
    }

    @GetMapping("/api/admin/foods/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> getFoodByIdAdmin(@PathVariable Integer id) {
        return ApiResponse.success("Food details", foodService.getById(id));
    }
}
