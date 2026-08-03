package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.FoodDTO;
import org.example.be.dto.FoodRequestDTO;
import org.example.be.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodController {
    @Autowired
    private FoodService foodService;

    @GetMapping
    public ApiResponse<List<FoodDTO>> getAllFoods(Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("List of foods", foodService.getAll(isAdmin));
    }

    @GetMapping("/search")
    public ApiResponse<List<FoodDTO>> searchFoods(@RequestParam String keyword, Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("Search results", foodService.search(keyword, isAdmin));
    }

    @GetMapping("/{id}")
    public ApiResponse<FoodDTO> getFoodById(@PathVariable Integer id) {
        return ApiResponse.success("Food details", foodService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> createFood(@Valid @RequestBody FoodRequestDTO requestDTO) {
        return ApiResponse.success("Food created", foodService.create(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> updateFood(@PathVariable Integer id, @Valid @RequestBody FoodRequestDTO requestDTO) {
        return ApiResponse.success("Food updated", foodService.update(id, requestDTO));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> activateFood(@PathVariable Integer id) {
        return ApiResponse.success("Food restored", foodService.activate(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<FoodDTO> deleteFood(@PathVariable Integer id) {
        return ApiResponse.success("Food deleted", foodService.delete(id));
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_SystemAdmin"));
    }
}
