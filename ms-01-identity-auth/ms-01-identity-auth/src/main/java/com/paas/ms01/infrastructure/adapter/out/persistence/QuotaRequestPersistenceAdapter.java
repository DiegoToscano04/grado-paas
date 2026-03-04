package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.QuotaStatus;
import com.paas.ms01.domain.ports.out.QuotaRequestPersistencePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class QuotaRequestPersistenceAdapter implements QuotaRequestPersistencePort {

    private final QuotaRequestJpaRepository repository;

    @Override
    public QuotaRequestEntity save(QuotaRequestEntity request) {
        return repository.save(request);
    }

    @Override
    public boolean hasPendingRequest(UUID userId) {
        return repository.existsByUserIdAndStatus(userId, QuotaStatus.PENDING);
    }

    @Override
    public List<QuotaRequestEntity> findByStatus(QuotaStatus status) {
        return repository.findByStatusOrderByCreatedAtAsc(status);
    }

    @Override
    public Optional<QuotaRequestEntity> findById(Long id) {
        return repository.findById(id);
    }
}