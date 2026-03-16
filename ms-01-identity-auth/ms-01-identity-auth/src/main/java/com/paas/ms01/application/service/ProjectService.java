package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.*;
import com.paas.ms01.domain.ports.in.*;
import com.paas.ms01.domain.ports.out.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectAuditLogEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService implements CreateProjectUseCase, ListProjectsUseCase, GetProjectDetailsUseCase, RequestProjectApprovalUseCase, UpdateProjectStatusUseCase, DeleteProjectUseCase, UpdateProjectUseCase {

    private final ProjectPersistencePort projectPersistencePort;
    private final UserPersistencePort userPersistencePort;
    private final ObjectMapper objectMapper = new ObjectMapper(); // <--- CAMBIO: Instanciar el conversor de JSON
    private final ComposerEnginePort composerEnginePort; //
    private final AuditLogPort auditLogPort;
    private final TerminateMessagePort terminateMessagePort;
    private final NotificationService notificationService;


    /**
     * Implementa el flujo de las pantallas 1 y 2 de Figma:
     * Recibe todos los datos, valida, simula la llamada a MS-02,
     * verifica cuotas y crea el proyecto en estado 'WAITING_USER_CONFIRMATION'.
     */
    @Override
    @Transactional
    public ProjectEntity createProject(CreateProjectCommand command) {
        // 1. Validar que el nombre del proyecto no exista para este usuario (RF-009)
        if (projectPersistencePort.existsByNameAndUserId(command.getName(), command.getUserId())) {
            throw new IllegalStateException("Ya existe un proyecto con ese nombre.");
        }

        // 2. Obtener el usuario para verificar cuotas y obtener su código
        UserEntity user = userPersistencePort.findById(command.getUserId())
                .orElseThrow(() -> new IllegalStateException("Error interno: Usuario autenticado no encontrado."));

        // 3. Generar el nombre del Namespace (RF-007)
        String sanitizedProjectName = sanitizeForNamespace(command.getName());
        String namespaceName = sanitizedProjectName + "-" + user.getCode();

        // =================================================================
        // ----- LLAMADA REAL A MS-02 (Composer Engine) -----
        // =================================================================
        ValidationResult validationResult = composerEnginePort.validateCompose(
                command.getArchitecture(),
                command.getDockerComposeContent(),
                namespaceName
        );

        // Si Python dice que no es válido, detenemos todo y mostramos los errores (RF-015)
        if (!validationResult.isValid()) {
            String errorMessage = String.join(" | ", validationResult.errors());
            throw new IllegalArgumentException("Error en docker-compose: " + errorMessage);
        }

        // 4. Verificar Cuotas (RF-035, RF-036)
        // Nota: Aquí faltaría sumar los recursos de los proyectos existentes del usuario.
        // Por ahora, solo validamos contra el límite global.
        if (user.getQuotaCpuLimit().compareTo(validationResult.requiredCpu()) < 0) {
            throw new IllegalStateException("Cuota de CPU excedida. Límite: " + user.getQuotaCpuLimit() + ", Solicitado: " + validationResult.requiredCpu());
        }
        if (user.getQuotaMemoryLimitMb() < validationResult.requiredMemoryMb()) {
            throw new IllegalStateException("Cuota de Memoria excedida. Límite: " + user.getQuotaMemoryLimitMb() + "MB, Solicitado: " + validationResult.requiredMemoryMb() + "MB");
        }
        if (user.getQuotaStorageLimitMb() < validationResult.requiredStorageMb()) {
            throw new IllegalStateException("Cuota de Almacenamiento excedida. Límite: " + user.getQuotaStorageLimitMb() + "MB, Solicitado: " + validationResult.requiredStorageMb() + "MB");
        }


        // 5. Crear la entidad del proyecto con todos los datos validados
        ProjectEntity newProject = new ProjectEntity();
        newProject.setUserId(command.getUserId());
        newProject.setName(command.getName());
        newProject.setDescription(command.getDescription());
        newProject.setArchitecture(command.getArchitecture());
        newProject.setNamespaceName(namespaceName);
        newProject.setDockerComposeContent(command.getDockerComposeContent());

        // Guardamos los recursos calculados por MS-02
        newProject.setReqCpu(validationResult.requiredCpu());
        newProject.setReqMemoryMb(validationResult.requiredMemoryMb());
        newProject.setReqStorageMb(validationResult.requiredStorageMb());
        newProject.setReqStorageMb(validationResult.requiredStorageMb());
        newProject.setGeneratedManifests(validationResult.manifests());

        // El estado ahora refleja que el usuario debe confirmar la vista de resumen
        newProject.setStatus(ProjectStatus.WAITING_USER_CONFIRMATION);

        // 6. Guardar en la base de datos
        return projectPersistencePort.save(newProject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectEntity> findByUserId(UUID userId) {
        return projectPersistencePort.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ProjectEntity> findByIdAndUserId(UUID projectId, UUID userId) {
        return projectPersistencePort.findById(projectId)
                .filter(project -> project.getUserId().equals(userId));
    }

    @Transactional
    public void requestApproval(UUID projectId, UUID userId) {
        // 1. Buscar el proyecto y asegurar que pertenece al usuario
        ProjectEntity project = projectPersistencePort.findById(projectId)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado o acceso denegado."));

        // 2. Validar la máquina de estados (Solo se puede enviar si está esperando confirmación)
        if (project.getStatus() != ProjectStatus.WAITING_USER_CONFIRMATION) {
            throw new IllegalStateException("El proyecto no se encuentra en estado válido para solicitar aprobación. Estado actual: " + project.getStatus());
        }

        // 3. Cambiar el estado
        project.setStatus(ProjectStatus.PENDING_APPROVAL);

        // 4. Guardar los cambios
        projectPersistencePort.save(project);


        // Servicio de Notificaciones
        notificationService.notifyAdmins("Nueva Solicitud de Despliegue", "El proyecto '" + project.getName() + "' requiere aprobación.");
    }


    /**
     * Convierte un nombre de proyecto en un string válido para un namespace de Kubernetes,
     * cumpliendo con el estándar RFC 1123.
     */
    private String sanitizeForNamespace(String projectName) {
        // 1. Limpieza básica
        String sanitized = projectName.toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "");

        // 2. Eliminar guiones al principio...
        while(sanitized.startsWith("-")) {
            sanitized = sanitized.substring(1);
        }

        // 3. ...y eliminar guiones al final.
        while(sanitized.endsWith("-")) {
            sanitized = sanitized.substring(0, sanitized.length() - 1);
        }

        return sanitized;
    }

    @Override
    @Transactional
    public void updateStatus(UUID projectId, ProjectStatus newStatus, String message) {
        ProjectEntity project = projectPersistencePort.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado"));

        ProjectStatus previousStatus = project.getStatus();
        project.setStatus(newStatus);

        // Si MS-03 nos dice que ya lo destruyó, aplicamos el borrado lógico.
        if (newStatus == ProjectStatus.TERMINATED) {
            project.setDeletedAt(LocalDateTime.now());
        }

        // --- BLOQUE DE NOTIFICACIONES ---
        if (newStatus == ProjectStatus.DEPLOYED) {
            notificationService.notifyUser(project.getUserId(), "Despliegue Exitoso", "Tu proyecto '" + project.getName() + "' ya está corriendo en el clúster.");
        } else if (newStatus == ProjectStatus.FAILED) {
            notificationService.notifyUser(project.getUserId(), "Error de Despliegue", "Hubo un error al desplegar '" + project.getName() + "': " + message);
        } else if (newStatus == ProjectStatus.TERMINATED) { // <--- NUEVA NOTIFICACIÓN AQUÍ
            notificationService.notifyUser(project.getUserId(), "Proyecto Eliminado", "El proyecto '" + project.getName() + "' fue destruido físicamente y tu cuota ha sido liberada.");
        }

        projectPersistencePort.save(project);

        // Registro de Auditoría Automático del Sistema
        ProjectAuditLogEntity audit = new ProjectAuditLogEntity();
        audit.setProjectId(projectId);
        audit.setPreviousStatus(previousStatus);
        audit.setNewStatus(newStatus);
        audit.setReason(message);

        // Mapear el estado a la acción de auditoría correcta
        ProjectActionType action;
        if (newStatus == ProjectStatus.DEPLOYING) action = ProjectActionType.DEPLOY_START;
        else if (newStatus == ProjectStatus.DEPLOYED) action = ProjectActionType.DEPLOY_SUCCESS;
        else if (newStatus == ProjectStatus.FAILED) action = ProjectActionType.DEPLOY_FAILED;
        else if (newStatus == ProjectStatus.TERMINATED) action = ProjectActionType.DELETE;
        else action = ProjectActionType.APPROVE; // Valor por defecto de seguridad

        audit.setAction(action);
        auditLogPort.saveProjectAudit(audit);
    }

    // --- NUEVO MÉTODO DE DESTRUCCIÓN ---
    @Override
    @Transactional
    public void deleteProject(UUID projectId, UUID userId) {
        ProjectEntity project = projectPersistencePort.findById(projectId)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado o no autorizado."));

        ProjectStatus previousStatus = project.getStatus();

        // Lo ponemos en estado TERMINATING
        project.setStatus(ProjectStatus.TERMINATING);
        projectPersistencePort.save(project);

        // Guardar Auditoría
        ProjectAuditLogEntity audit = new ProjectAuditLogEntity();
        audit.setProjectId(projectId);
        audit.setChangedByUserId(userId);
        audit.setPreviousStatus(previousStatus);
        audit.setNewStatus(ProjectStatus.TERMINATING);
        audit.setAction(ProjectActionType.TERMINATE);
        audit.setReason("El usuario solicitó la eliminación del proyecto.");
        auditLogPort.saveProjectAudit(audit);

        // Enviar orden a RabbitMQ
        TerminateMessage message = new TerminateMessage(project.getId(), project.getNamespaceName());
        terminateMessagePort.sendTerminateCommand(message);
    }

    @Override
    @Transactional
    public ProjectEntity updateProject(UUID projectId, String newComposeContent, UUID userId) {
        ProjectEntity project = projectPersistencePort.findById(projectId)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado o no autorizado."));

        // 1. Validar el NUEVO contenido con MS-02 (Python)
        var validationResult = composerEnginePort.validateCompose(
                project.getArchitecture(),
                newComposeContent,
                project.getNamespaceName()
        );

        if (!validationResult.isValid()) {
            String errorMessage = String.join(" | ", validationResult.errors());
            throw new IllegalArgumentException("Error en docker-compose: " + errorMessage);
        }

        // 2. Verificar que las nuevas cuotas no excedan el límite global del usuario
        UserEntity user = userPersistencePort.findById(userId).get();
        if (user.getQuotaCpuLimit().compareTo(validationResult.requiredCpu()) < 0) {
            throw new IllegalStateException("Cuota de CPU excedida.");
        }
        if (user.getQuotaMemoryLimitMb() < validationResult.requiredMemoryMb()) {
            throw new IllegalStateException("Cuota de Memoria excedida.");
        }

        ProjectStatus previousStatus = project.getStatus();

        // 3. Actualizar la entidad con los nuevos manifiestos y recursos
        project.setDockerComposeContent(newComposeContent);
        project.setGeneratedManifests(validationResult.manifests());
        project.setReqCpu(validationResult.requiredCpu());
        project.setReqMemoryMb(validationResult.requiredMemoryMb());
        project.setReqStorageMb(validationResult.requiredStorageMb());

        // 4. Devolverlo al estado de borrador para que el usuario confirme y pida aprobación
        project.setStatus(ProjectStatus.WAITING_USER_CONFIRMATION);

        // 5. Guardar Auditoría de Redespliegue
        ProjectAuditLogEntity audit = new ProjectAuditLogEntity();
        audit.setProjectId(project.getId());
        audit.setChangedByUserId(userId);
        audit.setPreviousStatus(previousStatus);
        audit.setNewStatus(ProjectStatus.WAITING_USER_CONFIRMATION);
        audit.setAction(ProjectActionType.REDEPLOY);
        audit.setReason("El usuario editó el docker-compose y generó una nueva versión.");
        auditLogPort.saveProjectAudit(audit);

        return projectPersistencePort.save(project);
    }
}