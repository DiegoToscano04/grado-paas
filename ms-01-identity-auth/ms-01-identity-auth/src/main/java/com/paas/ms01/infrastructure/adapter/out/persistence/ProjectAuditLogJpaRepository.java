package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.ProjectActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectAuditLogJpaRepository extends JpaRepository<ProjectAuditLogEntity, Long> {
    Optional<ProjectAuditLogEntity> findFirstByProjectIdAndActionInOrderByCreatedAtDesc(UUID projectId, List<ProjectActionType> actions);
}