package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.ProjectActionType;
import com.paas.ms01.domain.ports.out.AuditLogPort;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectAuditLogEntity;
import com.paas.ms01.domain.model.ProjectStatus;
import com.paas.ms01.domain.ports.in.ListPendingProjectsUseCase;
import com.paas.ms01.domain.ports.in.ReviewProjectUseCase;
import com.paas.ms01.domain.ports.out.ProjectPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminProjectService implements ListPendingProjectsUseCase, ReviewProjectUseCase {

    private final ProjectPersistencePort projectPersistencePort;
    private final AuditLogPort auditLogPort;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectEntity> getPendingApprovalProjects() {
        return projectPersistencePort.findByStatus(ProjectStatus.PENDING_APPROVAL);
    }

    @Override
    @Transactional
    public void approveProject(UUID projectId, UUID adminId) {
        ProjectEntity project = getProjectAndValidateStatus(projectId);
        ProjectStatus previousStatus = project.getStatus();
        project.setStatus(ProjectStatus.APPROVED);
        projectPersistencePort.save(project);

        // --- REGISTRO DE AUDITORÍA ---
        saveAudit(projectId, adminId, previousStatus, ProjectStatus.APPROVED, ProjectActionType.APPROVE, "Aprobado administrativamente.");
        // TODO: Publicar evento en RabbitMQ para MS-03
    }

    @Override
    @Transactional
    public void rejectProject(UUID projectId, UUID adminId, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("El motivo de rechazo es obligatorio.");
        }

        ProjectEntity project = getProjectAndValidateStatus(projectId);
        ProjectStatus previousStatus = project.getStatus();
        project.setStatus(ProjectStatus.REJECTED);
        projectPersistencePort.save(project);

        // --- REGISTRO DE AUDITORÍA ---
        saveAudit(projectId, adminId, previousStatus, ProjectStatus.REJECTED, ProjectActionType.REJECT, reason);
    }

    // Metodo auxiliar para no repetir código
    private void saveAudit(UUID projectId, UUID adminId, ProjectStatus prev, ProjectStatus curr, ProjectActionType action, String reason) {
        ProjectAuditLogEntity audit = new ProjectAuditLogEntity();
        audit.setProjectId(projectId);
        audit.setChangedByUserId(adminId);
        audit.setPreviousStatus(prev);
        audit.setNewStatus(curr);
        audit.setAction(action);
        audit.setReason(reason);
        auditLogPort.saveProjectAudit(audit);
    }


    private ProjectEntity getProjectAndValidateStatus(UUID projectId) {
        ProjectEntity project = projectPersistencePort.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado."));

        if (project.getStatus() != ProjectStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("El proyecto no está pendiente de aprobación. Estado actual: " + project.getStatus());
        }
        return project;
    }
}