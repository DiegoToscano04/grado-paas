package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.QuotaStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuotaRequestJpaRepository extends JpaRepository<QuotaRequestEntity, Long> {
    // Nos servirá para verificar si ya tiene una solicitud pendiente
    boolean existsByUserIdAndStatus(UUID userId, QuotaStatus status);
    List<QuotaRequestEntity> findByStatusOrderByCreatedAtAsc(QuotaStatus status);
}