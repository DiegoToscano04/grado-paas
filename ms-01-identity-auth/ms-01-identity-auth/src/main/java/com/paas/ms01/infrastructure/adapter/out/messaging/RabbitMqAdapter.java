package com.paas.ms01.infrastructure.adapter.out.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.paas.ms01.domain.model.DeployMessage;
import com.paas.ms01.domain.model.TerminateMessage;
import com.paas.ms01.domain.ports.out.DeployMessagePort;
import com.paas.ms01.domain.ports.out.TerminateMessagePort;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RabbitMqAdapter implements DeployMessagePort, TerminateMessagePort {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private static final String DEPLOY_QUEUE = "deploy.queue";
    private static final String TERMINATE_QUEUE = "terminate.queue";

    @Override
    public void sendDeployCommand(DeployMessage message) {
        try {
            // Convertimos nuestro Record a JSON
            String jsonMessage = objectMapper.writeValueAsString(message);

            // Enviamos el mensaje a la cola
            rabbitTemplate.convertAndSend(DEPLOY_QUEUE, jsonMessage);

            System.out.println("✅ [MS-01] Mensaje enviado a RabbitMQ para el proyecto: " + message.projectId());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al serializar el mensaje de despliegue", e);
        }
    }

    @Override
    public void sendTerminateCommand(TerminateMessage message) {
        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            rabbitTemplate.convertAndSend(TERMINATE_QUEUE, jsonMessage);
            System.out.println("🧨 [MS-01] Mensaje de DESTRUCCIÓN enviado para el proyecto: " + message.projectId());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error al serializar el mensaje de terminación", e);
        }
    }

    // --- Configuración interna para asegurar que la cola exista en Java también ---
    @Configuration
    static class RabbitConfig {
        @Bean
        public Queue deployQueue() {
            return new Queue(DEPLOY_QUEUE, true);
        }

        @Bean
        public Queue terminateQueue() { // <--- REGISTRAR LA NUEVA COLA
            return new Queue(TERMINATE_QUEUE, true);
        }
    }
}