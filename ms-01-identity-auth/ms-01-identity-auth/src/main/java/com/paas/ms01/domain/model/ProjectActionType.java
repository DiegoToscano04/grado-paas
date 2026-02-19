package com.paas.ms01.domain.model;

public enum ProjectActionType {
    CREATE,
    APPROVE,
    REJECT,
    DEPLOY_START,
    DEPLOY_SUCCESS,
    DEPLOY_FAILED,
    REDEPLOY,
    REDEPLOY_START,
    REDEPLOY_SUCCESS,
    REDEPLOY_FAILED,
    TERMINATE,
    DELETE
}