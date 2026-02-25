package com.paas.ms01.domain.ports.out;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectAuditLogEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserAuditLogEntity;

public interface AuditLogPort {
    void saveProjectAudit(ProjectAuditLogEntity auditLog);
    void saveUserAudit(UserAuditLogEntity auditLog);
}