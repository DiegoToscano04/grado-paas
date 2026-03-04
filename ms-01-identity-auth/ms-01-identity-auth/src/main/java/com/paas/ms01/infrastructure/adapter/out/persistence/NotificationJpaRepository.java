package com.paas.ms01.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, UUID> {
    // Para traer las notificaciones más nuevas primero
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}