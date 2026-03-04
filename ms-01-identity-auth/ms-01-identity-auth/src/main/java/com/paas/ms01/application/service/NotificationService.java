package com.paas.ms01.application.service;

import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.infrastructure.adapter.out.persistence.NotificationEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.NotificationJpaRepository;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationJpaRepository notificationRepository;
    private final UserJpaRepository userRepository; // Para buscar a los admins

    // 1. Enviar notificación a un usuario específico (Estudiante)
    @Transactional
    public void notifyUser(UUID userId, String title, String message) {
        NotificationEntity notification = new NotificationEntity();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    // 2. Enviar notificación a TODOS los administradores
    @Transactional
    public void notifyAdmins(String title, String message) {
        List<UserEntity> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ADMIN && u.getDeletedAt() == null)
                .toList();

        for (UserEntity admin : admins) {
            notifyUser(admin.getId(), title, message);
        }
    }

    // 3. Obtener notificaciones de un usuario
    @Transactional(readOnly = true)
    public List<NotificationEntity> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // 4. Marcar como leída
    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}