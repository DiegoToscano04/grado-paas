package com.paas.ms01.domain.ports.in;

import java.util.UUID;

public interface DeleteProjectUseCase {
    void deleteProject(UUID projectId, UUID userId);
}