package com.paas.ms01.domain.model;

public enum ProjectStatus {
    DRAFT,
    WAITING_USER_CONFIRMATION,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    DEPLOYING,
    DEPLOYED,
    FAILED,
    TERMINATING,
    TERMINATED
}