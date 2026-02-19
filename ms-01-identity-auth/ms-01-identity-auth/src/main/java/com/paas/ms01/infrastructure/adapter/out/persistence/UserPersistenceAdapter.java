package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.ports.out.UserPersistencePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserPersistencePort {

    private final UserJpaRepository jpaRepository;

    @Override
    public UserEntity save(UserEntity user) {
        return jpaRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        // Asumiendo que no está borrado lógicamente
        return jpaRepository.findAll().stream()
                .anyMatch(u -> u.getEmail().equals(email) && u.getDeletedAt() == null);
        // Nota: Idealmente haríamos una query JPQL custom, pero esto sirve por ahora.
    }

    @Override
    public boolean existsByCode(String code) {
        return jpaRepository.findAll().stream()
                .anyMatch(u -> u.getCode().equals(code) && u.getDeletedAt() == null);
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        // Filtramos lógicamente borrados
        return jpaRepository.findAll().stream()
                .filter(u -> u.getEmail().equals(email) && u.getDeletedAt() == null)
                .findFirst();
    }

    @Override
    public Optional<UserEntity> findById(UUID userId) {
        return jpaRepository.findById(userId);
    }
}