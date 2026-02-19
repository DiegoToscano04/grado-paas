package com.paas.ms01.infrastructure.adapter.out.persistence;

import com.paas.ms01.domain.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectJpaRepository extends JpaRepository<ProjectEntity, UUID> {

    // Listar proyectos activos de un usuario
    List<ProjectEntity> findByUserIdAndDeletedAtIsNull(UUID userId);

    // Verificar si ya existe un proyecto con ese nombre para ese usuario (activo)
    boolean existsByNameAndUserIdAndDeletedAtIsNull(String name, UUID userId);

    // Buscar un proyecto específico por ID asegurando que no esté borrado
    Optional<ProjectEntity> findByIdAndDeletedAtIsNull(UUID id);

    //Buscar proyecto por estado
    List<ProjectEntity> findByStatusAndDeletedAtIsNull(ProjectStatus status);

}