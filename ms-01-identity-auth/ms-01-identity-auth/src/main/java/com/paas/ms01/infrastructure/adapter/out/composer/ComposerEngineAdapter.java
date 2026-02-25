package com.paas.ms01.infrastructure.adapter.out.composer;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.paas.ms01.domain.model.AppArchitecture;
import com.paas.ms01.domain.model.ValidationResult;
import com.paas.ms01.domain.ports.out.ComposerEnginePort;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ComposerEngineAdapter implements ComposerEnginePort {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.ms02.url}")
    private String ms02Url;

    @Override
    public ValidationResult validateCompose(AppArchitecture architecture, String composeContent, String namespaceName) {
        String endpoint = ms02Url + "/api/composer/validate";

        // 1. Preparar el body de la petición
        Ms02Request requestBody = new Ms02Request();
        requestBody.setArchitecture(architecture.name());
        requestBody.setComposeContent(composeContent);
        requestBody.setNamespaceName(namespaceName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Ms02Request> request = new HttpEntity<>(requestBody, headers);

        try {
            // 2. Hacer la llamada POST al MS-02 (Python)
            Ms02Response response = restTemplate.postForObject(endpoint, request, Ms02Response.class);

            if (response == null) {
                throw new IllegalStateException("La respuesta del motor de composición fue nula.");
            }

            // 3. Mapear la respuesta al modelo de dominio
            return new ValidationResult(
                    response.isValid(),
                    response.getErrors(),
                    response.getRequiredCpu(),
                    response.getRequiredMemoryMb(),
                    response.getRequiredStorageMb(),
                    response.getManifests()
            );

        } catch (ResourceAccessException e) {
            throw new IllegalStateException("No se pudo contactar con el Motor de Composición (MS-02). Verifica que esté encendido.", e);
        }
    }

    // --- DTOs Internos para mapear el JSON de Python (snake_case) ---
    @Data
    private static class Ms02Request {
        private String architecture;
        @JsonProperty("compose_content")
        private String composeContent;
        @JsonProperty("namespace_name")
        private String namespaceName;
    }

    @Data
    private static class Ms02Response {
        @JsonProperty("is_valid")
        private boolean isValid;
        private List<String> errors;
        @JsonProperty("required_cpu")
        private BigDecimal requiredCpu;
        @JsonProperty("required_memory_mb")
        private int requiredMemoryMb;
        @JsonProperty("required_storage_mb")
        private int requiredStorageMb;
        private List<String> manifests;
    }
}