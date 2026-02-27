package com.paas.ms01.domain.model;

import java.util.List;
import java.util.UUID;

public record DeployMessage(
        UUID projectId,
        String namespaceName,
        List<String> manifests
) {}