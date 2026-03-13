package com.paas.ms01.domain.model;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProjectHistoryItem {
    private UUID id;
    private String name;
    private String namespaceName;
    private AppArchitecture architecture;
    private ProjectStatus status;
    private LocalDateTime processedAt;
    private String reason;
    private String adminName;
}