package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.LoginCommand;
import com.paas.ms01.domain.model.RegisterUserCommand;
import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.domain.ports.in.LoginUseCase;
import com.paas.ms01.domain.ports.in.RegisterUserUseCase;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements RegisterUserUseCase, LoginUseCase {

    private final UserPersistencePort userPersistencePort;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public UserEntity login(LoginCommand command) {
        UserEntity user = userPersistencePort.findByEmail(command.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas")); // No decir "Usuario no existe" por seguridad

        if (!passwordEncoder.matches(command.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Usuario deshabilitado. Contacte al administrador.");
        }

        return user;
    }

    @Override
    @Transactional
    public UserEntity register(RegisterUserCommand command) {
        // 1. Validar unicidad
        if (userPersistencePort.existsByEmail(command.getEmail())) {
            throw new RuntimeException("El correo ya está registrado");
        }
        if (userPersistencePort.existsByCode(command.getStudentCode())) {
            throw new RuntimeException("El código de estudiante ya está registrado");
        }

        // 2. Crear Entidad
        UserEntity newUser = new UserEntity();
        newUser.setName(command.getName());
        newUser.setEmail(command.getEmail());
        newUser.setCode(command.getStudentCode());
        newUser.setPasswordHash(passwordEncoder.encode(command.getPassword()));
        newUser.setRole(UserRole.STUDENT); // Por defecto Student
        newUser.setIsActive(true);

        // Cuotas por defecto (Hardcoded por ahora, luego parametrizables)
        newUser.setQuotaCpuLimit(new java.math.BigDecimal("2.0"));
        newUser.setQuotaMemoryLimitMb(2048);
        newUser.setQuotaStorageLimitMb(5120);

        // 3. Guardar
        return userPersistencePort.save(newUser);
    }


}