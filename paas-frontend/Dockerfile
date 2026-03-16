# ETAPA 1: Compilar React
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ETAPA 2: Servidor NGINX de Producción
FROM nginx:alpine
# Copiar los archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiar nuestra configuración de enrutamiento
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
