package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.model.ProjectStatus;
import com.paas.ms01.domain.ports.in.UpdateProjectStatusUseCase;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/projects")
@RequiredArgsConstructor
public class InternalProjectController {

    private final UpdateProjectStatusUseCase updateProjectStatusUseCase;

    @Value("${app.internal.api-key}")
    private String internalApiKey;

    @PatchMapping("/{projectId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID projectId,
            @RequestHeader("X-Internal-API-Key") String apiKey,
            @RequestBody UpdateStatusRequest request) {

        // Validar la llave maestra
        if (!internalApiKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("API Key inválida");
        }

        try {
            updateProjectStatusUseCase.updateStatus(projectId, request.getStatus(), request.getMessage());
            return ResponseEntity.ok("Estado del proyecto actualizado a " + request.getStatus());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @Data
    static class UpdateStatusRequest {
        private ProjectStatus status;
        private String message;
    }
}