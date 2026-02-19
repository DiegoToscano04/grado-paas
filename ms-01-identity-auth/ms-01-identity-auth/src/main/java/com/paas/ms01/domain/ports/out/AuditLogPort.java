package com.paas.ms01.domain.ports.out;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectAuditLogEntity;

public interface AuditLogPort {
    void saveProjectAudit(ProjectAuditLogEntity auditLog);
}