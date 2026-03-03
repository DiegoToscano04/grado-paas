package com.paas.ms01.domain.ports.in;

import com.paas.ms01.domain.model.ProjectStatus;
import java.util.UUID;

public interface UpdateProjectStatusUseCase {
    void updateStatus(UUID projectId, ProjectStatus newStatus, String message);
}