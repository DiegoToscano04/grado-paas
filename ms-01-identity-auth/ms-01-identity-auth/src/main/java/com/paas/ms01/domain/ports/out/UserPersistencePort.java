package com.paas.ms01.domain.ports.out;

import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import java.util.Optional;
import java.util.UUID;

public interface UserPersistencePort {
    UserEntity save(UserEntity user);
    boolean existsByEmail(String email);
    boolean existsByCode(String code);
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findById(UUID userId);
}