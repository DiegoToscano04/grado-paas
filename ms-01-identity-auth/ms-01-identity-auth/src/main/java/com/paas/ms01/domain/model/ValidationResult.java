package com.paas.ms01.domain.model;

import java.math.BigDecimal;
import java.util.List;

public record ValidationResult(
        boolean isValid,
        List<String> errors,
        BigDecimal requiredCpu,
        int requiredMemoryMb,
        int requiredStorageMb,
        List<String> manifests
) {}