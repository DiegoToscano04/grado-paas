package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.ports.out.AuditLogPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuditLogAdapter implements AuditLogPort {
    private final ProjectAuditLogJpaRepository repository;

    @Override
    public void saveProjectAudit(ProjectAuditLogEntity auditLog) {
        repository.save(auditLog);
    }
}