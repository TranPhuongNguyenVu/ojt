package org.example.be.controller;

import org.example.be.dto.ApiResponse;
import org.example.be.entity.Version;
import org.example.be.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/versions")
public class VersionController {

    @Autowired
    private VersionRepository versionRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Version>>> getAllVersions() {
        List<Version> versions = versionRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("Fetch versions successfully", versions));
    }
}
