package com.paas.ms01.domain.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterUserCommand {
    private String name;
    private String email;
    private String studentCode;
    private String password;
}