package com.paas.ms01.domain.ports.in;
import com.paas.ms01.infrastructure.adapter.out.persistence.QuotaRequestEntity;
import java.util.List;

public interface ListPendingQuotaRequestsUseCase {
    List<QuotaRequestEntity> getPendingRequests();
}