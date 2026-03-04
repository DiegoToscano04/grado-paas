package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.ports.in.ListPendingQuotaRequestsUseCase;
import com.paas.ms01.domain.ports.in.ReviewQuotaRequestUseCase;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/quotas")
@RequiredArgsConstructor
public class AdminQuotaController {

    private final ListPendingQuotaRequestsUseCase listPendingQuotaRequestsUseCase;
    private final ReviewQuotaRequestUseCase reviewQuotaRequestUseCase;
    private final UserPersistencePort userPersistencePort; // Para buscar el nombre del estudiante

    @GetMapping("/pending")
    public ResponseEntity<List<PendingQuotaResponse>> getPendingRequests() {
        var requests = listPendingQuotaRequestsUseCase.getPendingRequests();

        var response = requests.stream().map(req -> {
            // Buscamos al estudiante para mostrar su nombre y código en el Dashboard
            var user = userPersistencePort.findById(req.getUserId()).orElse(null);

            return PendingQuotaResponse.builder()
                    .requestId(req.getId())
                    .studentName(user != null ? user.getName() : "Desconocido")
                    .studentCode(user != null ? user.getCode() : "N/A")
                    .requestedCpu(req.getQuotaCpuRequest())
                    .requestedMemoryMb(req.getQuotaMemoryRequestMb())
                    .requestedStorageMb(req.getQuotaStorageRequestMb())
                    .justification(req.getJustification())
                    .createdAt(req.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/review")
    public ResponseEntity<?> reviewRequest(
            @PathVariable Long requestId,
            @RequestBody @Valid ReviewQuotaDto reviewDto,
            @AuthenticationPrincipal CustomUserDetails admin) {
        try {
            reviewQuotaRequestUseCase.reviewRequest(
                    requestId,
                    reviewDto.getApprove(),
                    reviewDto.getAdminResponse(),
                    admin.getUserEntity().getId()
            );
            String action = reviewDto.getApprove() ? "aprobada" : "rechazada";
            return ResponseEntity.ok("Solicitud " + action + " correctamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- DTOs ---
    @Value
    @Builder
    static class PendingQuotaResponse {
        Long requestId;
        String studentName;
        String studentCode;
        BigDecimal requestedCpu;
        Integer requestedMemoryMb;
        Integer requestedStorageMb;
        String justification;
        LocalDateTime createdAt;
    }

    @Data
    static class ReviewQuotaDto {
        @NotNull(message = "Debes indicar si apruebas o rechazas la solicitud.")
        private Boolean approve;
        @NotBlank(message = "Debes dejar un comentario/respuesta al estudiante.")
        private String adminResponse;
    }
}