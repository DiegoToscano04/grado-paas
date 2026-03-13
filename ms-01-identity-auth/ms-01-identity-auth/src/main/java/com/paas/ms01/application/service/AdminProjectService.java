package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.DeployMessage;
import com.paas.ms01.domain.model.ProjectHistoryItem;
import com.paas.ms01.domain.ports.in.GetProjectHistoryUseCase;
import com.paas.ms01.domain.ports.out.DeployMessagePort;
import com.paas.ms01.domain.model.ProjectActionType;
import com.paas.ms01.domain.ports.out.AuditLogPort;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectAuditLogEntity;
import com.paas.ms01.domain.model.ProjectStatus;
import com.paas.ms01.domain.ports.in.ListPendingProjectsUseCase;
import com.paas.ms01.domain.ports.in.ReviewProjectUseCase;
import com.paas.ms01.domain.ports.out.ProjectPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProjectService implements ListPendingProjectsUseCase, ReviewProjectUseCase, GetProjectHistoryUseCase {

    private final ProjectPersistencePort projectPersistencePort;
    private final AuditLogPort auditLogPort;
    private final DeployMessagePort deployMessagePort;
    private final NotificationService notificationService;
    private final UserPersistencePort userPersistencePort;

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

        // --- ENVIAR A KUBERNETES VÍA RABBITMQ (NUEVO) ---
        DeployMessage deployMessage = new DeployMessage(
                project.getId(),
                project.getNamespaceName(),
                project.getGeneratedManifests()
        );
        deployMessagePort.sendDeployCommand(deployMessage);
        notificationService.notifyUser(project.getUserId(), "Despliegue Aprobado", "Tu proyecto '" + project.getName() + "' ha sido aprobado y está en proceso de despliegue en Kubernetes.");
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
        notificationService.notifyUser(project.getUserId(), "Despliegue Rechazado", "Tu proyecto '" + project.getName() + "' fue rechazado con correcciones. Revisa los detalles en el panel.");
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectEntity getProjectById(UUID id) {
        // AHORA EL ADMIN PUEDE VER PROYECTOS AUNQUE EL ESTUDIANTE LOS HAYA BORRADO
        return projectPersistencePort.findByIdIncludingDeleted(id)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado en la base de datos."));
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

    @Override
    @Transactional(readOnly = true)
    public List<ProjectHistoryItem> getHistory() {
        List<ProjectStatus> historicalStatuses = List.of(
                ProjectStatus.APPROVED, ProjectStatus.REJECTED, ProjectStatus.DEPLOYED, ProjectStatus.FAILED, ProjectStatus.TERMINATED
        );

        List<ProjectEntity> projects = projectPersistencePort.findHistoryByStatuses(historicalStatuses);

        return projects.stream().map(p -> {
            var auditOpt = auditLogPort.findLatestDecisionLogForProject(p.getId());

            String reason = auditOpt.map(ProjectAuditLogEntity::getReason).orElse("Sin detalles");
            String adminName = auditOpt.map(ProjectAuditLogEntity::getChangedByUserId)
                    .flatMap(userPersistencePort::findById)
                    .map(UserEntity::getName)
                    .orElse("Sistema");

            // MAGIA: El estado histórico depende de lo que diga la Auditoría, no de cómo esté el proyecto hoy.
            ProjectStatus historicalStatus = p.getStatus();
            if (auditOpt.isPresent()) {
                if (auditOpt.get().getAction() == ProjectActionType.REJECT) {
                    historicalStatus = ProjectStatus.REJECTED;
                } else if (auditOpt.get().getAction() == ProjectActionType.APPROVE) {
                    historicalStatus = ProjectStatus.APPROVED;
                }
            }

            return ProjectHistoryItem.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .namespaceName(p.getNamespaceName())
                    .architecture(p.getArchitecture())
                    .status(historicalStatus) // <--- Usamos el estado inmutable
                    .processedAt(auditOpt.map(ProjectAuditLogEntity::getCreatedAt).orElse(p.getUpdatedAt()))
                    .reason(reason)
                    .adminName(adminName)
                    .build();
        }).collect(Collectors.toList());
    }
}