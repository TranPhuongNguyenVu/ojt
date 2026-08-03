package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.service.ComboService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/combos")
public class ComboController {
    @Autowired
    private ComboService comboService;

    @GetMapping
    public ApiResponse<List<ComboDTO>> getAllCombos(Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("List of combos", comboService.getAll(isAdmin));
    }

    @GetMapping("/search")
    public ApiResponse<List<ComboDTO>> searchCombos(@RequestParam String keyword, Authentication auth) {
        boolean isAdmin = isAdmin(auth);
        return ApiResponse.success("Search results", comboService.search(keyword, isAdmin));
    }

    @GetMapping("/{id}")
    public ApiResponse<ComboDTO> getComboById(@PathVariable Integer id) {
        return ApiResponse.success("Combo details", comboService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> createCombo(@Valid @RequestBody ComboRequestDTO requestDTO) {
        return ApiResponse.success("Combo created", comboService.create(requestDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> updateCombo(@PathVariable Integer id, @Valid @RequestBody ComboRequestDTO requestDTO) {
        return ApiResponse.success("Combo updated", comboService.update(id, requestDTO));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> activateCombo(@PathVariable Integer id) {
        return ApiResponse.success("Combo restored", comboService.activate(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> deleteCombo(@PathVariable Integer id) {
        return ApiResponse.success("Combo deleted", comboService.delete(id));
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin") || a.getAuthority().equals("ROLE_SystemAdmin"));
    }
}
