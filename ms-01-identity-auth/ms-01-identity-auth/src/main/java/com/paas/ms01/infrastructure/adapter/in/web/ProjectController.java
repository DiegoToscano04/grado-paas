package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.ports.in.RequestProjectApprovalUseCase;
import com.paas.ms01.domain.model.AppArchitecture;
import com.paas.ms01.domain.model.CreateProjectCommand;
import com.paas.ms01.domain.ports.in.CreateProjectUseCase;
import com.paas.ms01.domain.ports.in.GetProjectDetailsUseCase;
import com.paas.ms01.domain.ports.in.ListProjectsUseCase;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.paas.ms01.domain.model.ProjectStatus;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final CreateProjectUseCase createProjectUseCase;
    private final ListProjectsUseCase listProjectsUseCase;
    private final GetProjectDetailsUseCase getProjectDetailsUseCase;
    private final RequestProjectApprovalUseCase requestProjectApprovalUseCase;

    @PostMapping
    public ResponseEntity<?> createAndValidateProject(
            @RequestBody @Valid CreateProjectRequest request,
            @AuthenticationPrincipal CustomUserDetails authenticatedUser) {

        try {
            CreateProjectCommand command = CreateProjectCommand.builder()
                    .name(request.getName())
                    .description(request.getDescription())
                    .architecture(request.getArchitecture())
                    .dockerComposeContent(request.getDockerComposeContent())
                    .userId(authenticatedUser.getUserEntity().getId()) // Obtenemos el ID desde la entidad
                    .build();

            ProjectEntity createdProject = createProjectUseCase.createProject(command);

            // Construimos la respuesta para la pantalla 3 de Figma
            ProjectValidationResponse response = ProjectValidationResponse.builder()
                    .projectId(createdProject.getId())
                    .status(createdProject.getStatus().name())
                    .requiredCpu(createdProject.getReqCpu().toPlainString() + " vCPU")
                    .requiredMemoryMb(createdProject.getReqMemoryMb() + " MB")
                    .requiredStorageGb("1.0 GB") // Hardcoded por ahora
                    .generatedManifests(createdProject.getGeneratedManifests())
                    .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ProjectSummaryResponse>> getMyProjects(
            @AuthenticationPrincipal CustomUserDetails authenticatedUser) {

        List<ProjectEntity> projects = listProjectsUseCase.findByUserId(authenticatedUser.getUserEntity().getId());

        // Convertimos la lista de Entidades a una lista de DTOs
        List<ProjectSummaryResponse> response = projects.stream()
                .map(project -> ProjectSummaryResponse.builder()
                        .id(project.getId())
                        .name(project.getName())
                        .description(project.getDescription())
                        .namespaceName(project.getNamespaceName())
                        .architecture(project.getArchitecture())
                        .status(project.getStatus())
                        .createdAt(project.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProjectDetails(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails authenticatedUser) {

        return getProjectDetailsUseCase.findByIdAndUserId(projectId, authenticatedUser.getUserEntity().getId())
                .map(project -> {
                    // Mapea la entidad a un DTO de respuesta detallado
                    ProjectDetailsResponse response = ProjectDetailsResponse.fromEntity(project);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build()); // 404 si no se encuentra o no pertenece al usuario
    }

    // Metodo para solicitar aprobación
    @PostMapping("/{projectId}/request-approval")
    public ResponseEntity<?> requestProjectApproval(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal CustomUserDetails authenticatedUser) {

        try {
            requestProjectApprovalUseCase.requestApproval(projectId, authenticatedUser.getUserEntity().getId());

            // Retornamos un mensaje de éxito simple
            return ResponseEntity.ok("Solicitud de despliegue enviada al administrador exitosamente.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ----- DTOs -----

    // DTO para la respuesta detallada
    @Value
    @Builder
    static class ProjectDetailsResponse {
        UUID id;
        String name;
        String description;
        String namespaceName;
        AppArchitecture architecture;
        ProjectStatus status;
        LocalDateTime createdAt;
        LocalDateTime updatedAt;

        // metodo conversor estático para mantener la lógica de mapeo limpia
        public static ProjectDetailsResponse fromEntity(ProjectEntity entity) {
            return ProjectDetailsResponse.builder()
                    .id(entity.getId())
                    .name(entity.getName())
                    .description(entity.getDescription())
                    .namespaceName(entity.getNamespaceName())
                    .architecture(entity.getArchitecture())
                    .status(entity.getStatus())
                    .createdAt(entity.getCreatedAt())
                    .updatedAt(entity.getUpdatedAt())
                    .build();
        }
    }

    // DTO para la respuesta de la lista
    @Value // Similar a @Data pero inmutable
    @Builder
    static class ProjectSummaryResponse {
        UUID id;
        String name;
        String description;
        String namespaceName;
        AppArchitecture architecture;
        ProjectStatus status;
        LocalDateTime createdAt;
    }

    // DTO para la petición de creación
    @Data
    static class CreateProjectRequest {
        @NotBlank(message = "El nombre del proyecto es obligatorio")
        private String name;

        @NotBlank(message = "La descripción del proyecto es obligatoria")
        private String description;

        @NotNull(message = "El tipo de arquitectura es obligatorio")
        private AppArchitecture architecture;

        @NotBlank(message = "El contenido de docker-compose es obligatorio")
        private String dockerComposeContent;
    }

    @Value
    @Builder
    static class ProjectValidationResponse {
        UUID projectId; // El ID del proyecto recién creado
        String status;    // El nuevo estado (WAITING_USER_CONFIRMATION)
        String requiredCpu;
        String requiredMemoryMb;
        String requiredStorageGb;
        List<String> generatedManifests; // Lista de nombres de archivos (ej: "db-statefulset.yaml")
    }

}