package com.paas.ms01.infrastructure.config;

import com.paas.ms01.domain.model.UserRole;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserJpaRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals(email)) // Aquí podrías optimizar con un findByEmail real en el Repo
                .findFirst()
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // Convertimos nuestra UserEntity al UserDetails interno de Spring Security
        return new User(
                userEntity.getEmail(),
                userEntity.getPasswordHash(),
                userEntity.getIsActive(),
                true, true, true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + userEntity.getRole().name()))
        );
    }
}