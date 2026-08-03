package org.example.be.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.dto.ApiResponse;
import org.example.be.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "movie-theater") String folder) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Vui lòng chọn file để tải lên!"));
        }
        
        String fileUrl = cloudinaryService.uploadFile(file, folder);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh lên thành công!", fileUrl));
    }
}
