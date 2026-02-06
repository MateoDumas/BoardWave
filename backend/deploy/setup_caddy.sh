#!/bin/bash

# Instalar Caddy
if command -v yum &> /dev/null; then
    sudo yum install -y yum-plugin-copr
    sudo yum copr enable -y @caddy/caddy
    sudo yum install -y caddy
elif command -v apt-get &> /dev/null; then
    sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
fi

# Obtener IP pública
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
DOMAIN="${PUBLIC_IP//./-}.sslip.io"

echo "Configurando HTTPS para: $DOMAIN"

# Crear Caddyfile
sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
$DOMAIN {
    reverse_proxy localhost:3000
}
EOF

# Reiniciar Caddy
sudo systemctl enable caddy
sudo systemctl restart caddy

echo "¡Listo! Tu backend está en: https://$DOMAIN"
