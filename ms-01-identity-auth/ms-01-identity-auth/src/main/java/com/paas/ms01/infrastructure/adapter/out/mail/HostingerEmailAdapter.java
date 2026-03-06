package com.paas.ms01.infrastructure.adapter.out.mail;

import com.paas.ms01.domain.ports.out.EmailPort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HostingerEmailAdapter implements EmailPort {

    private final JavaMailSender mailSender;

    // Tomamos el correo remitente directamente de tus variables de entorno
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("PaaS Core Education <" + fromEmail + ">");
        message.setTo(toEmail);
        message.setSubject("Recuperación de Contraseña - PaaS Core");

        // El cuerpo del correo
        String text = "Hola,\n\n" +
                "Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en PaaS Core Education.\n\n" +
                "Haz clic en el siguiente enlace para crear una nueva contraseña:\n" +
                resetLink + "\n\n" +
                "Este enlace es válido por solo 15 minutos.\n" +
                "Si no solicitaste este cambio, puedes ignorar este correo con seguridad.\n\n" +
                "Atentamente,\nEl equipo de infraestructura.";

        message.setText(text);

        // ¡Disparamos el correo real!
        mailSender.send(message);
        System.out.println("📧 Correo de recuperación enviado con éxito a: " + toEmail);
    }
}