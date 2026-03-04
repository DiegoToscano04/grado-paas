package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.model.CreateQuotaRequestCommand;
import com.paas.ms01.domain.ports.in.RequestQuotaIncreaseUseCase;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/quotas")
@RequiredArgsConstructor
public class QuotaController {

    private final RequestQuotaIncreaseUseCase requestQuotaIncreaseUseCase;

    @PostMapping("/request")
    public ResponseEntity<?> requestQuotaIncrease(
            @RequestBody @Valid QuotaIncreaseRequestDto request,
            @AuthenticationPrincipal CustomUserDetails authenticatedUser) {

        try {
            CreateQuotaRequestCommand command = CreateQuotaRequestCommand.builder()
                    .userId(authenticatedUser.getUserEntity().getId())
                    .requestedCpu(request.getCpu())
                    .requestedMemoryMb(request.getMemoryMb())
                    .requestedStorageMb(request.getStorageMb())
                    .justification(request.getJustification())
                    .build();

            requestQuotaIncreaseUseCase.requestIncrease(command);

            return ResponseEntity.ok("Solicitud de aumento de cuota enviada correctamente al administrador.");

        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    static class QuotaIncreaseRequestDto {
        @NotNull(message = "El CPU es requerido")
        @Min(value = 1, message = "El CPU mínimo a solicitar es 1")
        private BigDecimal cpu;

        @NotNull(message = "La memoria es requerida")
        @Min(value = 512, message = "La memoria mínima a solicitar es 512 MB")
        private Integer memoryMb;

        @NotNull(message = "El almacenamiento es requerido")
        @Min(value = 1024, message = "El almacenamiento mínimo a solicitar es 1024 MB")
        private Integer storageMb;

        @NotBlank(message = "Debes proveer una justificación")
        private String justification;
    }
}