package com.paas.ms01.domain.ports.out;

public interface EmailPort {
    void sendPasswordResetEmail(String toEmail, String resetLink);
}