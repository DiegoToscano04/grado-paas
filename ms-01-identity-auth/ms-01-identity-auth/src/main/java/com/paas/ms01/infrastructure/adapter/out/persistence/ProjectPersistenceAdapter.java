package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.ProjectStatus;
import com.paas.ms01.domain.ports.out.ProjectPersistencePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProjectPersistenceAdapter implements ProjectPersistencePort {

    private final ProjectJpaRepository jpaRepository;

    @Override
    public ProjectEntity save(ProjectEntity project) {
        return jpaRepository.save(project);
    }

    @Override
    public Optional<ProjectEntity> findById(UUID id) {
        return jpaRepository.findByIdAndDeletedAtIsNull(id);
    }

    @Override
    public List<ProjectEntity> findByUserId(UUID userId) {
        return jpaRepository.findByUserIdAndDeletedAtIsNull(userId);
    }

    @Override
    public boolean existsByNameAndUserId(String name, UUID userId) {
        return jpaRepository.existsByNameAndUserIdAndDeletedAtIsNull(name, userId);
    }

    @Override
    public List<ProjectEntity> findByStatus(ProjectStatus status) {
        return jpaRepository.findByStatusAndDeletedAtIsNull(status);
    }
}