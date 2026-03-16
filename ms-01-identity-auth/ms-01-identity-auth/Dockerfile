# ETAPA 1: Construcción (Usamos una imagen pesada con Gradle y el JDK completo)
FROM gradle:8.5-jdk21-alpine AS builder
WORKDIR /app
# Copiamos todo el código fuente desde el PC al contenedor
COPY . .
# Compilamos el proyecto (genera el archivo .jar)
RUN gradle clean bootJar --no-daemon

# ETAPA 2: Producción (Usamos una imagen hiperligera solo con el JRE para correr el jar)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copiamos ÚNICAMENTE el archivo .jar ya compilado desde la Etapa 1
COPY --from=builder /app/build/libs/*-SNAPSHOT.jar app.jar

# Exponemos el puerto de MS-01
EXPOSE 8081

# Comando para arrancar Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
