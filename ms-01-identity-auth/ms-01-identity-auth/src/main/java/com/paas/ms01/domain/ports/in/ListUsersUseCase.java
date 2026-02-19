package com.paas.ms01.domain.ports.in;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import java.util.List;

public interface ListUsersUseCase {
    List<UserEntity> getAllStudents();
}