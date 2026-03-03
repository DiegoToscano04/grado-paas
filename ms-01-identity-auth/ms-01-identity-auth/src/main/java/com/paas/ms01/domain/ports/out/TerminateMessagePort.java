package com.paas.ms01.domain.ports.out;

import com.paas.ms01.domain.model.TerminateMessage;

public interface TerminateMessagePort {
    void sendTerminateCommand(TerminateMessage message);
}