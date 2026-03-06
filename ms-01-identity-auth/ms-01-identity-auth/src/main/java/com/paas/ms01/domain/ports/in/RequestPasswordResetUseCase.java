package com.paas.ms01.domain.ports.in;

public interface RequestPasswordResetUseCase {
    void requestReset(String email);
}