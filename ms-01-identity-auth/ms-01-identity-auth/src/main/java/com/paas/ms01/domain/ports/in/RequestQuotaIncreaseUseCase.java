package com.paas.ms01.domain.ports.in;

import com.paas.ms01.domain.model.CreateQuotaRequestCommand;
import com.paas.ms01.infrastructure.adapter.out.persistence.QuotaRequestEntity;

public interface RequestQuotaIncreaseUseCase {
    QuotaRequestEntity requestIncrease(CreateQuotaRequestCommand command);
}