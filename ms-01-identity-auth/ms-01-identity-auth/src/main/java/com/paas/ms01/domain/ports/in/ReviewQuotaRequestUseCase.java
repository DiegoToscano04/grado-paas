package com.paas.ms01.domain.ports.in;
import java.util.UUID;

public interface ReviewQuotaRequestUseCase {
    void reviewRequest(Long requestId, boolean approve, String adminResponse, UUID adminId);
}