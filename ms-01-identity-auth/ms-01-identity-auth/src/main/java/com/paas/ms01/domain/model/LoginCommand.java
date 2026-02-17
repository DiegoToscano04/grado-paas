package com.paas.ms01.domain.model;
import lombok.Data;

@Data
public class LoginCommand {
    private String email;
    private String password;
}