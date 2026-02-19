package com.paas.ms01.domain.ports.in;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import java.math.BigDecimal;
import java.util.UUID;

public interface ManageUserQuotasUseCase {
    UserEntity updateUserQuotas(UUID userId, BigDecimal cpu, Integer memoryMb, Integer storageMb, UUID adminId);
}