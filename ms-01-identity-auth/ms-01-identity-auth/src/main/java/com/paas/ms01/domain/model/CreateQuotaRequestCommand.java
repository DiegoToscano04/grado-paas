package com.paas.ms01.domain.model;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class CreateQuotaRequestCommand {
    private UUID userId;
    private BigDecimal requestedCpu;
    private Integer requestedMemoryMb;
    private Integer requestedStorageMb;
    private String justification;
}