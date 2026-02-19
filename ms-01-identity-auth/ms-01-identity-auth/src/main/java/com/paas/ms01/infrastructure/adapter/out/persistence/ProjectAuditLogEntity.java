package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.ProjectActionType;
import com.paas.ms01.domain.model.ProjectStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_audit_logs", schema = "paas_core")
@Data
public class ProjectAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "previous_status", columnDefinition = "paas_core.project_status")
    private ProjectStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "new_status", columnDefinition = "paas_core.project_status")
    private ProjectStatus newStatus;

    @Column(name = "changed_by_user_id")
    private UUID changedByUserId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "paas_core.project_action_type", nullable = false)
    private ProjectActionType action;

    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}