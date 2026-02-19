package com.paas.ms01.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectAuditLogJpaRepository extends JpaRepository<ProjectAuditLogEntity, Long> {
}