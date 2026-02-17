package com.paas.ms01.domain.ports.in;

import com.paas.ms01.domain.model.RegisterUserCommand;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;

public interface RegisterUserUseCase {
    UserEntity register(RegisterUserCommand command);
}