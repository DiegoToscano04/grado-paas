package com.paas.ms01.domain.ports.in;

import java.util.UUID;

public interface RequestProjectApprovalUseCase {
    void requestApproval(UUID projectId, UUID userId);
}