package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.domain.ports.in.ListUsersUseCase;
import com.paas.ms01.domain.ports.in.ManageUserQuotasUseCase;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService implements ListUsersUseCase, ManageUserQuotasUseCase {

    private final UserPersistencePort userPersistencePort;

    @Override
    @Transactional(readOnly = true)
    public List<UserEntity> getAllStudents() {
        // Obtenemos solo los estudiantes y que no estén borrados lógicamente
        return userPersistencePort.findAll().stream()
                .filter(user -> user.getRole() == UserRole.STUDENT)
                .filter(user -> user.getDeletedAt() == null)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserEntity updateUserQuotas(UUID userId, BigDecimal cpu, Integer memoryMb, Integer storageMb, UUID adminId) {
        UserEntity student = userPersistencePort.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado."));

        // Validaciones básicas
        if (cpu.compareTo(BigDecimal.ZERO) <= 0 || memoryMb <= 0 || storageMb <= 0) {
            throw new IllegalArgumentException("Las cuotas deben ser mayores a cero.");
        }

        // TODO: Para la tesis (RF-075), aquí deberías guardar un registro en user_audit_logs
        // indicando los valores anteriores y los nuevos, tal cual hicimos con los proyectos.

        student.setQuotaCpuLimit(cpu);
        student.setQuotaMemoryLimitMb(memoryMb);
        student.setQuotaStorageLimitMb(storageMb);

        return userPersistencePort.save(student);
    }
}