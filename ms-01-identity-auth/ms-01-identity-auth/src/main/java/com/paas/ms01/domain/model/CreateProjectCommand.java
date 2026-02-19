package com.paas.ms01.domain.model;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CreateProjectCommand {
    private String name;
    private String description;
    private AppArchitecture architecture;
    private UUID userId; // El ID del usuario que crea el proyecto
    private String dockerComposeContent;
}