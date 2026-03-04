package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.QuotaStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "quota_requests", schema = "paas_core")
@Data
public class QuotaRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "quota_cpu_request")
    private BigDecimal quotaCpuRequest;

    @Column(name = "quota_memory_request_mb")
    private Integer quotaMemoryRequestMb;

    @Column(name = "quota_storage_request_mb")
    private Integer quotaStorageRequestMb;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "paas_core.quota_status", nullable = false)
    private QuotaStatus status = QuotaStatus.PENDING;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "reviewed_by_user_id")
    private UUID reviewedByUserId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}