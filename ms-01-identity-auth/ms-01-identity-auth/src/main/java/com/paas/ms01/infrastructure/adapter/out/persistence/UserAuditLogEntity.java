package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.UserActionType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_audit_logs", schema = "paas_core")
@Data
public class UserAuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "affected_user_id", nullable = false)
    private UUID affectedUserId;

    @Column(name = "performed_by_user_id", nullable = false)
    private UUID performedByUserId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "paas_core.user_action_type", nullable = false)
    private UserActionType action;

    private String details;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "previous_state")
    private String previousState; // Aquí guardaremos el JSON con las cuotas antiguas

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}