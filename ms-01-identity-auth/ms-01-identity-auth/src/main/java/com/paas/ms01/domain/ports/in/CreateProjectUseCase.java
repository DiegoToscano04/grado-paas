package com.paas.ms01.domain.ports.in;

import com.paas.ms01.domain.model.CreateProjectCommand;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;

public interface CreateProjectUseCase {
    ProjectEntity createProject(CreateProjectCommand command);
}