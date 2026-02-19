package com.paas.ms01.domain.ports.in;
import java.util.UUID;

public interface ReviewProjectUseCase {
    void approveProject(UUID projectId, UUID adminId);
    void rejectProject(UUID projectId, UUID adminId, String reason);
}