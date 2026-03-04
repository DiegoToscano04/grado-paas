package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.QuotaStatus;
import com.paas.ms01.domain.ports.in.ListPendingQuotaRequestsUseCase;
import com.paas.ms01.domain.ports.in.ManageUserQuotasUseCase;
import com.paas.ms01.domain.ports.in.ReviewQuotaRequestUseCase;
import com.paas.ms01.domain.ports.out.QuotaRequestPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.QuotaRequestEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminQuotaService implements ListPendingQuotaRequestsUseCase, ReviewQuotaRequestUseCase {

    private final QuotaRequestPersistencePort quotaRequestPersistencePort;
    private final ManageUserQuotasUseCase manageUserQuotasUseCase; // Reutilizamos tu lógica robusta
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<QuotaRequestEntity> getPendingRequests() {
        return quotaRequestPersistencePort.findByStatus(QuotaStatus.PENDING);
    }

    @Override
    @Transactional
    public void reviewRequest(Long requestId, boolean approve, String adminResponse, UUID adminId) {
        QuotaRequestEntity request = quotaRequestPersistencePort.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada."));

        if (request.getStatus() != QuotaStatus.PENDING) {
            throw new IllegalStateException("Esta solicitud ya fue revisada previamente.");
        }

        // 1. Actualizar la solicitud
        request.setStatus(approve ? QuotaStatus.APPROVED : QuotaStatus.REJECTED);
        request.setAdminResponse(adminResponse);
        request.setReviewedByUserId(adminId);
        request.setReviewedAt(LocalDateTime.now());
        quotaRequestPersistencePort.save(request);

        // 2. Si es aprobada, aplicar las cuotas usando el caso de uso que ya guarda auditoría
        if (approve) {
            manageUserQuotasUseCase.updateUserQuotas(
                    request.getUserId(),
                    request.getQuotaCpuRequest(),
                    request.getQuotaMemoryRequestMb(),
                    request.getQuotaStorageRequestMb(),
                    adminId
            );
        }

        String msg = approve ? "Tu solicitud de aumento de cuotas fue aprobada." : "Tu solicitud de cuotas fue rechazada: " + adminResponse;
        notificationService.notifyUser(request.getUserId(), "Revisión de Cuotas", msg);
    }
}