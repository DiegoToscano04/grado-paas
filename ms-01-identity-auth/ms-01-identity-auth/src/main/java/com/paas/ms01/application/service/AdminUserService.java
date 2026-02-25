package com.paas.ms01.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paas.ms01.domain.model.UserActionType;
import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.domain.ports.in.ListUsersUseCase;
import com.paas.ms01.domain.ports.in.ManageUserQuotasUseCase;
import com.paas.ms01.domain.ports.out.AuditLogPort;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserAuditLogEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService implements ListUsersUseCase, ManageUserQuotasUseCase {

    private final UserPersistencePort userPersistencePort;
    private final AuditLogPort auditLogPort; // <--- Inyectar puerto de auditoría
    private final ObjectMapper objectMapper; // <--- Inyectar conversor JSON (Spring lo da automáticamente)


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

        /// 1. Capturar el estado ANTERIOR (Snapshot)
        Map<String, Object> previousState = new HashMap<>();
        previousState.put("quotaCpuLimit", student.getQuotaCpuLimit());
        previousState.put("quotaMemoryLimitMb", student.getQuotaMemoryLimitMb());
        previousState.put("quotaStorageLimitMb", student.getQuotaStorageLimitMb());

        String previousStateJson;
        try {
            previousStateJson = objectMapper.writeValueAsString(previousState);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al generar snapshot de auditoría.", e);
        }

        // 2. Actualizar la Entidad
        student.setQuotaCpuLimit(cpu);
        student.setQuotaMemoryLimitMb(memoryMb);
        student.setQuotaStorageLimitMb(storageMb);

        // 3. Crear el registro de Auditoría
        UserAuditLogEntity audit = new UserAuditLogEntity();
        audit.setAffectedUserId(student.getId());
        audit.setPerformedByUserId(adminId);
        audit.setAction(UserActionType.UPDATE_QUOTA);
        audit.setDetails(String.format("Cuotas actualizadas: CPU=%.2f, RAM=%dMB, Storage=%dMB", cpu, memoryMb, storageMb));
        audit.setPreviousState(previousStateJson); // <--- Guardamos el JSON inmutable

        // 4. Guardar todo (Como está en @Transactional, si algo falla, no se guarda nada)
        auditLogPort.saveUserAudit(audit);
        return userPersistencePort.save(student);
    }
}