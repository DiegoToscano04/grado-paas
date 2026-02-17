package com.paas.ms01.domain.ports.in;
import com.paas.ms01.domain.model.LoginCommand;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;

public interface LoginUseCase {
    UserEntity login(LoginCommand command);
}