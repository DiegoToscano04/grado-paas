package com.paas.ms01.domain.ports.in;

public interface ExecutePasswordResetUseCase {
    void executeReset(String token, String newPassword);
}