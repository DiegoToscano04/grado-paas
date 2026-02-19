package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.ports.in.ListPendingProjectsUseCase;
import com.paas.ms01.domain.ports.in.ReviewProjectUseCase;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/projects")
@RequiredArgsConstructor
public class AdminProjectController {

    private final ListPendingProjectsUseCase listPendingProjectsUseCase;
    private final ReviewProjectUseCase reviewProjectUseCase;

    // 1. Listar solicitudes pendientes (Para la barra lateral)
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingProjects() {
        var projects = listPendingProjectsUseCase.getPendingApprovalProjects();
        // Reutilizamos el DTO que creamos antes para resumir
        var response = projects.stream()
                .map(p -> ProjectController.ProjectSummaryResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .namespaceName(p.getNamespaceName())
                        .status(p.getStatus())
                        .architecture(p.getArchitecture())
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // 2. Aprobar Despliegue
    @PostMapping("/{projectId}/approve")
    public ResponseEntity<?> approveProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails admin) {
        try {
            reviewProjectUseCase.approveProject(projectId, admin.getUserEntity().getId());
            return ResponseEntity.ok("Proyecto aprobado exitosamente. Despliegue en curso.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Rechazar Despliegue
    @PostMapping("/{projectId}/reject")
    public ResponseEntity<?> rejectProject(
            @PathVariable UUID projectId,
            @RequestBody RejectRequest request,
            @AuthenticationPrincipal CustomUserDetails admin) {
        try {
            reviewProjectUseCase.rejectProject(projectId, admin.getUserEntity().getId(), request.getReason());
            return ResponseEntity.ok("Proyecto rechazado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    static class RejectRequest {
        private String reason;
    }
}