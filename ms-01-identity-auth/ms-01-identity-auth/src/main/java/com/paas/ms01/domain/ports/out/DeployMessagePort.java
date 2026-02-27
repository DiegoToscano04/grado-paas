package com.paas.ms01.domain.ports.out;

import com.paas.ms01.domain.model.DeployMessage;

public interface DeployMessagePort {
    void sendDeployCommand(DeployMessage message);
}