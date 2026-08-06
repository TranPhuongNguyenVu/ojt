package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.dto.CreateTypeRequest;
import org.example.be.entity.Type;
import org.example.be.repository.TypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/types")
public class TypeController {

    @Autowired
    private TypeRepository typeRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Type>>> getAllTypes() {
        List<Type> types = typeRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Fetch types successfully", types));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Admin', 'ROLE_SystemAdmin')")
    public ResponseEntity<ApiResponse<Type>> createType(@Valid @RequestBody CreateTypeRequest request) {
        String typeName = request.getTypeName().trim();
        if (typeRepository.existsByTypeNameIgnoreCase(typeName)) {
            throw new IllegalArgumentException("Thể loại này đã tồn tại.");
        }
        Type saved = typeRepository.save(Type.builder().typeName(typeName).build());
        return ResponseEntity.ok(ApiResponse.success("Type created", saved));
    }
}
