package com.paas.ms01.domain.ports.out;

import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectPersistencePort {
    ProjectEntity save(ProjectEntity project);
    Optional<ProjectEntity> findById(UUID id);
    List<ProjectEntity> findByUserId(UUID userId);
    boolean existsByNameAndUserId(String name, UUID userId);
}