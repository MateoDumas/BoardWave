# Etapa de construcción
FROM node:18-bullseye as builder

WORKDIR /app

# Instalar dependencias de compilación para Mediasoup (Python, GCC, Make)
RUN apt-get update && apt-get install -y python3 python3-pip build-essential

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa de producción
FROM node:18-bullseye-slim

WORKDIR /app

# Instalar dependencias de runtime (si es necesario)
RUN apt-get update && apt-get install -y python3 python3-pip build-essential

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

# Variables de entorno por defecto
ENV PORT=3000
ENV MEDIASOUP_MIN_PORT=10000
ENV MEDIASOUP_MAX_PORT=10050
ENV MEDIASOUP_ANNOUNCED_IP=127.0.0.1

EXPOSE 3000
# Exponer rango de puertos UDP para WebRTC
EXPOSE 10000-10050/udp

CMD ["node", "dist/server.js"]
