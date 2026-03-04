package com.paas.ms01.domain.ports.out;

import com.paas.ms01.domain.model.QuotaStatus;
import com.paas.ms01.infrastructure.adapter.out.persistence.QuotaRequestEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuotaRequestPersistencePort {
    QuotaRequestEntity save(QuotaRequestEntity request);
    boolean hasPendingRequest(UUID userId);
    List<QuotaRequestEntity> findByStatus(QuotaStatus status);
    Optional<QuotaRequestEntity> findById(Long id);
}