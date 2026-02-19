package com.paas.ms01.domain.ports.in;

import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import java.util.Optional;
import java.util.UUID;

public interface GetProjectDetailsUseCase {
    Optional<ProjectEntity> findByIdAndUserId(UUID projectId, UUID userId);
}