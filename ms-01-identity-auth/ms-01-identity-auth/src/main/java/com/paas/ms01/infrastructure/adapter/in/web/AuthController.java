package com.paas.ms01.infrastructure.adapter.in.web;

import com.paas.ms01.domain.model.LoginCommand;
import com.paas.ms01.domain.model.RegisterUserCommand;
import com.paas.ms01.domain.ports.in.LoginUseCase;
import com.paas.ms01.domain.ports.in.RegisterUserUseCase;
import com.paas.ms01.infrastructure.adapter.out.persistence.UserEntity;
import com.paas.ms01.infrastructure.config.JwtService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUseCase loginUseCase;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            RegisterUserCommand command = RegisterUserCommand.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .studentCode(request.getCode())
                    .password(request.getPassword())
                    .build();

            UserEntity user = registerUserUseCase.register(command);
            return ResponseEntity.ok("Usuario creado exitosamente con ID: " + user.getId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        try {
            LoginCommand command = new LoginCommand();
            command.setEmail(request.getEmail());
            command.setPassword(request.getPassword());

            UserEntity user = loginUseCase.login(command);

            // Generar Token
            String token = jwtService.generateToken(user.getEmail());

            // Crear Cookie HttpOnly
            ResponseCookie cookie = ResponseCookie.from("accessToken", token)
                    .httpOnly(true)       // JavaScript no puede leerla (Anti-XSS)
                    .secure(false)        // false por ahora (localhost no tiene HTTPS), true en producción
                    .path("/")            // Disponible para toda la app
                    .maxAge(24 * 60 * 60) // 1 día
                    .sameSite("Strict")   // Protección Anti-CSRF básica
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body("Login exitoso. Cookie establecida.");

        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Creamos una cookie con el mismo nombre pero con Max-Age = 0
        ResponseCookie cookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // <--- Esto le dice al navegador: "Bórrala de inmediato"
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body("Sesión cerrada correctamente.");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok("Estás autenticado como: " + userDetails.getUsername() +
                " con roles: " + userDetails.getAuthorities());
    }

    @Data
    static class LoginRequest {
        @NotBlank(message = "El correo es obligatorio")
        @Email
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
    }

    // DTO Interno para recibir el JSON
    @Data
    static class RegisterRequest {
        @NotBlank(message = "El nombre es obligatorio")
        private String name;

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Formato de correo inválido")
        private String email;

        @NotBlank(message = "El código es obligatorio")
        private String code;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;
    }
}