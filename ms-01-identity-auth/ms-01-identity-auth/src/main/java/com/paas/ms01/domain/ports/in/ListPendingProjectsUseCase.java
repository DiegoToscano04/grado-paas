package com.paas.ms01.domain.ports.in;
import com.paas.ms01.infrastructure.adapter.out.persistence.ProjectEntity;
import java.util.List;

public interface ListPendingProjectsUseCase {
    List<ProjectEntity> getPendingApprovalProjects();
}