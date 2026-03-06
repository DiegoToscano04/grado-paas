package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.LoginCommand;
import com.paas.ms01.domain.model.RegisterUserCommand;
import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.domain.ports.in.ExecutePasswordResetUseCase;
import com.paas.ms01.domain.ports.in.LoginUseCase;
import com.paas.ms01.domain.ports.in.RegisterUserUseCase;
import com.paas.ms01.domain.ports.in.RequestPasswordResetUseCase;
import com.paas.ms01.domain.ports.out.EmailPort;
import com.paas.ms01.domain.ports.out.UserPersistencePort;
import com.paas.ms01.infrastructure.adapter.out.persistence.PasswordResetTokenEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.PasswordResetTokenJpaRepository;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements RegisterUserUseCase, LoginUseCase, RequestPasswordResetUseCase, ExecutePasswordResetUseCase {

    private final UserPersistencePort userPersistencePort;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final PasswordResetTokenJpaRepository tokenRepository;
    private final EmailPort emailPort;

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

    @Override
    @Transactional
    public void requestReset(String email) {
        // 1. Buscar al usuario. Si no existe, NO lanzamos error por seguridad (previene escaneo de correos)
        userPersistencePort.findByEmail(email).ifPresent(user -> {

            // 2. Borrar tokens viejos del usuario para que no se acumulen
            tokenRepository.deleteByUserId(user.getId());

            // 3. Generar un nuevo token único y seguro
            String rawToken = UUID.randomUUID().toString();

            PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity();
            tokenEntity.setUserId(user.getId());
            tokenEntity.setToken(rawToken);
            tokenEntity.setExpiresAt(LocalDateTime.now().plusMinutes(15)); // Expira en 15 min

            tokenRepository.save(tokenEntity);

            // 4. Construir el enlace hacia tu Frontend en React (Figma)
            // Cuando pases a Google Cloud, cambiarás 'localhost:5173' por tu dominio real
            String resetLink = "http://localhost:5173/reset-password?token=" + rawToken;

            // 5. Enviar el correo
            emailPort.sendPasswordResetEmail(user.getEmail(), resetLink);
        });
    }

    @Override
    @Transactional
    public void executeReset(String token, String newPassword) {
        // 1. Buscar el token en la BD
        PasswordResetTokenEntity tokenEntity = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("El enlace de recuperación es inválido o no existe."));

        // 2. Validar que no haya expirado
        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(tokenEntity); // Lo borramos porque ya no sirve
            throw new IllegalArgumentException("El enlace de recuperación ha expirado. Por favor solicita uno nuevo.");
        }

        // 3. Buscar al usuario dueño de ese token
        UserEntity user = userPersistencePort.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        // 4. Encriptar y actualizar la nueva contraseña
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userPersistencePort.save(user);

        // 5. Borrar el token para que no se pueda usar dos veces
        tokenRepository.delete(tokenEntity);
    }
}