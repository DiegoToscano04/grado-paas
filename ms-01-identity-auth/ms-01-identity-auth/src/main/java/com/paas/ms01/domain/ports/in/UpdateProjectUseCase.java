package com.paas.ms01.domain.ports.in;

import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import java.util.UUID;

public interface UpdateProjectUseCase {
    ProjectEntity updateProject(UUID projectId, String newComposeContent, UUID userId);
}