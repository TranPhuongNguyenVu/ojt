package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.DrinkDTO;
import org.example.be.dto.DrinkRequestDTO;
import org.example.be.service.DrinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class DrinkController {
    @Autowired
    private DrinkService drinkService;

    @GetMapping("/api/drinks")
    public ApiResponse<List<DrinkDTO>> getAllDrinks() {
        return ApiResponse.success("List of drinks", drinkService.getAll(false));
    }

    @GetMapping("/api/drinks/search")
    public ApiResponse<List<DrinkDTO>> searchDrinks(@RequestParam String keyword) {
        return ApiResponse.success("Search results", drinkService.search(keyword, false));
    }

    @GetMapping("/api/drinks/{id}")
    public ApiResponse<DrinkDTO> getDrinkById(@PathVariable Integer id) {
        return ApiResponse.success("Drink details", drinkService.getPublicById(id));
    }

    @PostMapping("/api/drinks")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<DrinkDTO> createDrink(@Valid @RequestBody DrinkRequestDTO requestDTO) {
        return ApiResponse.success("Drink created", drinkService.create(requestDTO));
    }

    @PutMapping("/api/drinks/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<DrinkDTO> updateDrink(@PathVariable Integer id, @Valid @RequestBody DrinkRequestDTO requestDTO) {
        return ApiResponse.success("Drink updated", drinkService.update(id, requestDTO));
    }

    @PatchMapping("/api/drinks/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<DrinkDTO> activateDrink(@PathVariable Integer id) {
        return ApiResponse.success("Drink restored", drinkService.activate(id));
    }

    @DeleteMapping("/api/drinks/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<DrinkDTO> deleteDrink(@PathVariable Integer id) {
        return ApiResponse.success("Drink deleted", drinkService.delete(id));
    }

    @GetMapping("/api/admin/drinks")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<DrinkDTO>> getAllDrinksAdmin() {
        return ApiResponse.success("List of drinks", drinkService.getAll(true));
    }

    @GetMapping("/api/admin/drinks/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<DrinkDTO>> searchDrinksAdmin(@RequestParam String keyword) {
        return ApiResponse.success("Search results", drinkService.search(keyword, true));
    }

    @GetMapping("/api/admin/drinks/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<DrinkDTO> getDrinkByIdAdmin(@PathVariable Integer id) {
        return ApiResponse.success("Drink details", drinkService.getById(id));
    }
}
