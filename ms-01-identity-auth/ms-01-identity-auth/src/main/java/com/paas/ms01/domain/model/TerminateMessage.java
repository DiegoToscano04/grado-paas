package com.paas.ms01.domain.model;

import java.util.UUID;

public record TerminateMessage(
        UUID projectId,
        String namespaceName
) {}