package com.paas.ms01.infrastructure.config;

import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import java.util.Collection;

@Getter
public class CustomUserDetails extends User {
    private final UserEntity userEntity;

    public CustomUserDetails(UserEntity userEntity, Collection<? extends GrantedAuthority> authorities) {
        super(userEntity.getEmail(), userEntity.getPasswordHash(), authorities);
        this.userEntity = userEntity;
    }
}