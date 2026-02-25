package com.paas.ms01.domain.ports.out;

import com.paas.ms01.domain.model.AppArchitecture;
import com.paas.ms01.domain.model.ValidationResult;

public interface ComposerEnginePort {
    ValidationResult validateCompose(AppArchitecture architecture, String composeContent, String namespaceName);}