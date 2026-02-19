package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.AppArchitecture;
import com.paas.ms01.domain.model.ProjectStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects", schema = "paas_core")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "namespace_name", nullable = false, unique = true)
    private String namespaceName;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "paas_core.app_architecture", nullable = false)
    private AppArchitecture architecture;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "paas_core.project_status", nullable = false)
    private ProjectStatus status;

    @Column(name = "docker_compose_content", columnDefinition = "TEXT")
    private String dockerComposeContent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "generated_manifests")
    private List<String> generatedManifests; // Guardaremos el JSON de los manifiestos aquí

    @Column(name = "req_cpu")
    private BigDecimal reqCpu;

    @Column(name = "req_memory_mb")
    private Integer reqMemoryMb;

    @Column(name = "req_storage_mb")
    private Integer reqStorageMb;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "access_urls")
    private String accessUrls;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}