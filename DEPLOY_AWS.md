# Guía de Despliegue en AWS EC2 (Free Tier)

Esta guía te permitirá desplegar el backend de BoardWave en un servidor gratuito de Amazon AWS.

## Paso 1: Crear la instancia EC2

1. Inicia sesión en [AWS Console](https://console.aws.amazon.com/).
2. Ve al servicio **EC2** y pulsa en **Launch Instance** (Lanzar instancia).
3. **Name**: `BoardWave-Server`
4. **OS Image**: Selecciona **Ubuntu** (Ubuntu Server 24.04 LTS o 22.04 LTS).
5. **Instance Type**: Selecciona `t2.micro` o `t3.micro` (tienen etiqueta "Free tier eligible").
6. **Key Pair**:
   - Pulsa "Create new key pair".
   - Nombre: `boardwave-key`.
   - Tipo: `.pem`.
   - **Descárgalo y guárdalo bien** (lo necesitarás para entrar).
7. **Network settings** (Configuración de red) -> Pulsa **Edit** en la esquina:
   - Asegúrate de que "Auto-assign public IP" esté en **Enable**.
   - **Security group**: Create security group.
   - Añade las siguientes reglas (Inbound rules):
     - **SSH** | TCP | 22 | Source: Anywhere (0.0.0.0/0)
     - **HTTP** | TCP | 80 | Source: Anywhere
     - **Custom TCP** | TCP | **3000** | Source: Anywhere (Para la API)
     - **Custom UDP** | UDP | **10000 - 10050** | Source: Anywhere (Para el video/audio - ¡CRUCIAL!)
8. Pulsa **Launch Instance**.

## Paso 2: Conectarse al servidor

1. Ve a tu lista de instancias y selecciona la nueva.
2. Copia su **Public IPv4 address**.
3. Abre tu terminal (PowerShell o CMD) en la carpeta donde descargaste el archivo `.pem`.
4. Conéctate (cambia la IP por la tuya):
   ```bash
   ssh -i "boardwave-key.pem" ubuntu@TU_IP_PUBLICA
   ```
   *(Si te da error de permisos en el archivo key, en Windows: Propiedades -> Seguridad -> Avanzado -> Quitar herencia -> Borrar todos menos tu usuario).*

## Paso 3: Instalar BoardWave

Una vez dentro de la terminal del servidor (verás `ubuntu@ip-xyz...`), ejecuta estos comandos uno por uno:

```bash
# 1. Clonar el repositorio
git clone https://github.com/MateoDumas/BoardWave.git

# 2. Entrar a la carpeta
cd BoardWave

# 3. Dar permisos al script de instalación
chmod +x backend/deploy/install_aws.sh

# 4. Ejecutar el instalador mágico
./backend/deploy/install_aws.sh
```

El script instalará Docker, configurará la base de datos y arrancará todo automáticamente.

## Paso 4: Conectar el Frontend (Vercel)

1. Cuando el script termine, te mostrará la IP Pública.
2. Ve a tu proyecto en **Vercel -> Settings -> Environment Variables**.
3. Actualiza las variables con tu nueva IP de AWS:
   - `VITE_API_URL`: `http://TU_IP_AWS:3000`
   - `VITE_WS_URL`: `ws://TU_IP_AWS:3000`
   *(Nota: Como no tenemos dominio HTTPS, usaremos http/ws. Esto requiere que configures el navegador para permitir "insecure content" o idealmente ponerle un dominio más adelante).*

¡Listo! 🎉
