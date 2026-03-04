package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.CreateQuotaRequestCommand;
import com.paas.ms01.domain.model.QuotaStatus;
import com.paas.ms01.domain.ports.in.RequestQuotaIncreaseUseCase;
import com.paas.ms01.domain.ports.out.QuotaRequestPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.QuotaRequestEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuotaService implements RequestQuotaIncreaseUseCase {

    private final QuotaRequestPersistencePort quotaRequestPersistencePort;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public QuotaRequestEntity requestIncrease(CreateQuotaRequestCommand command) {
        // Regla de Negocio: Solo una solicitud pendiente a la vez
        if (quotaRequestPersistencePort.hasPendingRequest(command.getUserId())) {
            throw new IllegalStateException("Ya tienes una solicitud de aumento de cuota pendiente de revisión.");
        }

        QuotaRequestEntity request = new QuotaRequestEntity();
        request.setUserId(command.getUserId());
        request.setQuotaCpuRequest(command.getRequestedCpu());
        request.setQuotaMemoryRequestMb(command.getRequestedMemoryMb());
        request.setQuotaStorageRequestMb(command.getRequestedStorageMb());
        request.setJustification(command.getJustification());
        request.setStatus(QuotaStatus.PENDING);

        notificationService.notifyAdmins("Solicitud de Cuota", "Un estudiante ha solicitado un aumento de recursos.");
        return quotaRequestPersistencePort.save(request);
    }
}