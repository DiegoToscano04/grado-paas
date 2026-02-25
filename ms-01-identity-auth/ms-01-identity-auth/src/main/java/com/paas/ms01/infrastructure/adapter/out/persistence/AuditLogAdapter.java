package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.ports.out.AuditLogPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditLogAdapter implements AuditLogPort {

    private final ProjectAuditLogJpaRepository projectAuditRepo;
    private final UserAuditLogJpaRepository userAuditRepo; // <--- INYECTAR NUEVO REPO

    @Override
    public void saveProjectAudit(ProjectAuditLogEntity auditLog) {
        projectAuditRepo.save(auditLog);
    }

    @Override
    public void saveUserAudit(UserAuditLogEntity auditLog) { // <--- IMPLEMENTAR
        userAuditRepo.save(auditLog);
    }
}