package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.ports.in.ListUsersUseCase;
import com.paas.ms01.domain.ports.in.ManageUserQuotasUseCase;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final ListUsersUseCase listUsersUseCase;
    private final ManageUserQuotasUseCase manageUserQuotasUseCase;

    // 1. Directorio de Estudiantes (Figma Pantalla 1)
    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> getStudents() {
        var students = listUsersUseCase.getAllStudents();

        var response = students.stream()
                .map(user -> UserSummaryResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .code(user.getCode())
                        .isActive(user.getIsActive())
                        .quotaCpu(user.getQuotaCpuLimit())
                        .quotaMemoryMb(user.getQuotaMemoryLimitMb())
                        .quotaStorageMb(user.getQuotaStorageLimitMb())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 2. Ajustar Límites Globales (Figma Pantalla 4)
    @PutMapping("/{userId}/quotas")
    public ResponseEntity<?> updateQuotas(
            @PathVariable UUID userId,
            @RequestBody @Valid UpdateQuotasRequest request,
            @AuthenticationPrincipal CustomUserDetails admin) {
        try {
            var updatedUser = manageUserQuotasUseCase.updateUserQuotas(
                    userId,
                    request.getCpu(),
                    request.getMemoryMb(),
                    request.getStorageMb(),
                    admin.getUserEntity().getId()
            );
            return ResponseEntity.ok("Cuotas actualizadas correctamente para el estudiante " + updatedUser.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- DTOs ---
    @Value
    @Builder
    static class UserSummaryResponse {
        UUID id;
        String name;
        String email;
        String code;
        Boolean isActive;
        BigDecimal quotaCpu;
        Integer quotaMemoryMb;
        Integer quotaStorageMb;
    }

    @Data
    static class UpdateQuotasRequest {
        @NotNull(message = "El límite de CPU es requerido.")
        @Min(value = 1, message = "El CPU debe ser mínimo 1.")
        private BigDecimal cpu;

        @NotNull(message = "El límite de Memoria es requerido.")
        @Min(value = 256, message = "La memoria debe ser mínimo 256 MB.")
        private Integer memoryMb;

        @NotNull(message = "El límite de Almacenamiento es requerido.")
        @Min(value = 512, message = "El almacenamiento debe ser mínimo 512 MB.")
        private Integer storageMb;
    }
}