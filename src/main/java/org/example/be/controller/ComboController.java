package org.example.be.controller;

import jakarta.validation.Valid;
import org.example.be.dto.ApiResponse;
import org.example.be.dto.ComboDTO;
import org.example.be.dto.ComboRequestDTO;
import org.example.be.service.ComboService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ComboController {
    @Autowired
    private ComboService comboService;

    @GetMapping("/api/combos")
    public ApiResponse<List<ComboDTO>> getAllCombos() {
        return ApiResponse.success("List of combos", comboService.getAll(false));
    }

    @GetMapping("/api/combos/search")
    public ApiResponse<List<ComboDTO>> searchCombos(@RequestParam String keyword) {
        return ApiResponse.success("Search results", comboService.search(keyword, false));
    }

    @GetMapping("/api/combos/{id}")
    public ApiResponse<ComboDTO> getComboById(@PathVariable Integer id) {
        return ApiResponse.success("Combo details", comboService.getPublicById(id));
    }

    @PostMapping("/api/combos")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> createCombo(@Valid @RequestBody ComboRequestDTO requestDTO) {
        return ApiResponse.success("Combo created", comboService.create(requestDTO));
    }

    @PutMapping("/api/combos/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> updateCombo(@PathVariable Integer id, @Valid @RequestBody ComboRequestDTO requestDTO) {
        return ApiResponse.success("Combo updated", comboService.update(id, requestDTO));
    }

    @PatchMapping("/api/combos/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> activateCombo(@PathVariable Integer id) {
        return ApiResponse.success("Combo restored", comboService.activate(id));
    }

    @DeleteMapping("/api/combos/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> deleteCombo(@PathVariable Integer id) {
        return ApiResponse.success("Combo deleted", comboService.delete(id));
    }

    @GetMapping("/api/admin/combos")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<ComboDTO>> getAllCombosAdmin() {
        return ApiResponse.success("List of combos", comboService.getAll(true));
    }

    @GetMapping("/api/admin/combos/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<List<ComboDTO>> searchCombosAdmin(@RequestParam String keyword) {
        return ApiResponse.success("Search results", comboService.search(keyword, true));
    }

    @GetMapping("/api/admin/combos/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ApiResponse<ComboDTO> getComboByIdAdmin(@PathVariable Integer id) {
        return ApiResponse.success("Combo details", comboService.getById(id));
    }
}
