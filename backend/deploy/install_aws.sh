#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando instalación de BoardWave en AWS EC2 ===${NC}"

# 1. Actualizar sistema (Detectar gestor de paquetes)
echo -e "${GREEN}[1/5] Actualizando paquetes del sistema...${NC}"
if command -v apt-get &> /dev/null; then
    echo "Detectado sistema basado en Debian/Ubuntu"
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y curl git
elif command -v yum &> /dev/null; then
    echo "Detectado sistema basado en Amazon Linux/RHEL"
    sudo yum update -y
    sudo yum install -y curl git
else
    echo "Gestor de paquetes no soportado. Continuando con riesgos..."
fi

echo -e "${GREEN}[1.5/5] Configurando SWAP (Memoria Virtual)...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "SWAP de 2GB creada correctamente."
else
    echo "SWAP ya existe."
fi

# 2. Instalar Docker y Docker Compose
echo -e "${GREEN}[2/5] Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    # Detectar usuario actual para añadir al grupo docker
    CURRENT_USER=$(whoami)
    sudo usermod -aG docker $CURRENT_USER
    echo "Docker instalado. Usuario $CURRENT_USER añadido al grupo docker."
    # Iniciar servicio en Amazon Linux si es necesario
    sudo service docker start || true
else
    echo "Docker ya está instalado."
fi

echo -e "${GREEN}[3/5] Verificando código fuente...${NC}"

# Lógica inteligente para detectar ubicación
if [ -f "../../docker-compose.yml" ]; then
    echo "Detectado ejecución desde backend/deploy. Subiendo a raíz..."
    cd ../..
elif [ -f "docker-compose.yml" ]; then
    echo "Ya estamos en la raíz del proyecto."
else
    echo "No se encontró el proyecto. Clonando repositorio..."
    if [ -d "BoardWave" ]; then
        echo "La carpeta BoardWave ya existe. Entrando..."
        cd BoardWave
        echo "Actualizando código..."
        git pull
    else
        git clone https://github.com/MateoDumas/BoardWave.git
        cd BoardWave
    fi
fi

# 3. Configurar IP Pública automáticamente
echo -e "${GREEN}[4/5] Configurando IP Pública...${NC}"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "IP Pública detectada: $PUBLIC_IP"

# Crear archivo .env para docker-compose
echo "Generando .env..."
echo "PUBLIC_IP=$PUBLIC_IP" > .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "POSTGRES_USER=postgres" >> .env
echo "POSTGRES_PASSWORD=password" >> .env
echo "POSTGRES_DB=boardwave" >> .env

echo -e "${GREEN}[5/5] Iniciando contenedores...${NC}"
# Intentar usar docker compose (v2) o docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Necesitamos sudo si el usuario actual no ha reiniciado sesión para pillar el grupo docker
sudo $DOCKER_COMPOSE_CMD down
sudo $DOCKER_COMPOSE_CMD up -d --build

echo -e "${BLUE}=== ¡Despliegue Completado! ===${NC}"
echo -e "Backend corriendo en: http://$PUBLIC_IP:3000"
echo -e "WebSocket en: ws://$PUBLIC_IP:3000"
echo -e ""
echo -e "IMPORTANTE: Configura el Security Group en AWS:"
echo -e " - TCP 3000 (Custom TCP)"
echo -e " - UDP 10000-10050 (Custom UDP)"
echo -e " - SSH 22 (Ya debería estar)"
