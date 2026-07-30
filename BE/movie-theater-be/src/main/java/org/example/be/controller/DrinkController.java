package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.DrinkDTO;
import org.example.be.dto.DrinkRequestDTO;
import org.example.be.service.DrinkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drinks")
public class DrinkController {
    @Autowired
    private DrinkService drinkService;

    @GetMapping
    public ApiResponse<List<DrinkDTO>> getAllDrinks(Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("List of drinks", drinkService.getAll(isAdmin));
    }

    @GetMapping("/search")
    public ApiResponse<List<DrinkDTO>> searchDrinks(@RequestParam String keyword, Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("Search results", drinkService.search(keyword, isAdmin));
    }

    @GetMapping("/{id}")
    public ApiResponse<DrinkDTO> getDrinkById(@PathVariable Integer id) {
        return ApiResponse.success("Drink details", drinkService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<DrinkDTO> createDrink(@Valid @RequestBody DrinkRequestDTO requestDTO) {
        return ApiResponse.success("Drink created", drinkService.create(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<DrinkDTO> updateDrink(@PathVariable Integer id, @Valid @RequestBody DrinkRequestDTO requestDTO) {
        return ApiResponse.success("Drink updated", drinkService.update(id, requestDTO));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<DrinkDTO> activateDrink(@PathVariable Integer id) {
        return ApiResponse.success("Drink restored", drinkService.activate(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_Admin')")
    public ApiResponse<DrinkDTO> deleteDrink(@PathVariable Integer id) {
        return ApiResponse.success("Drink deleted", drinkService.delete(id));
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin"));
    }
}
