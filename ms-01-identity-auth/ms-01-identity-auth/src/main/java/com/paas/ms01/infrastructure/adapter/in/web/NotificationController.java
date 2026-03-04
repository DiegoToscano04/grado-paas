package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.application.service.NotificationService;
import com.paas.ms01.infrastructure.config.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getMyNotifications(@AuthenticationPrincipal CustomUserDetails user) {
        var notifications = notificationService.getUserNotifications(user.getUserEntity().getId());
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails user) {
        try {
            notificationService.markAsRead(id, user.getUserEntity().getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}