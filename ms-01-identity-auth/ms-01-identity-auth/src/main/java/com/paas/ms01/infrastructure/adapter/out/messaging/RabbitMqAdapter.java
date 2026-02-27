package com.paas.ms01.infrastructure.adapter.out.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paas.ms01.domain.model.DeployMessage;
import com.paas.ms01.domain.ports.out.DeployMessagePort;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RabbitMqAdapter implements DeployMessagePort {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private static final String QUEUE_NAME = "deploy.queue";

    @Override
    public void sendDeployCommand(DeployMessage message) {
        try {
            // Convertimos nuestro Record a JSON
            String jsonMessage = objectMapper.writeValueAsString(message);

            // Enviamos el mensaje a la cola
            rabbitTemplate.convertAndSend(QUEUE_NAME, jsonMessage);

            System.out.println("✅ [MS-01] Mensaje enviado a RabbitMQ para el proyecto: " + message.projectId());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al serializar el mensaje de despliegue", e);
        }
    }

    // --- Configuración interna para asegurar que la cola exista en Java también ---
    @Configuration
    static class RabbitConfig {
        @Bean
        public Queue deployQueue() {
            return new Queue(QUEUE_NAME, true); // true = durable
        }
    }
}