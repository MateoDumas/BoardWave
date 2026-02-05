#!/bin/bash

echo "=== BoardWave HTTPS Tunnel Setup ==="
echo "Este script creará un túnel HTTPS seguro hacia tu backend local (puerto 3000)."
echo "Esto es necesario para que el frontend en Vercel (HTTPS) pueda conectarse."

echo ""
echo "Intentando conectar con localhost.run (Gratis, sin registro)..."
echo "Si ves una URL como https://random-name.localhost.run, COPIALA."
echo "Esa es la URL que debes usar en el frontend: https://tu-frontend.vercel.app/?backend=https://random-name.localhost.run"
echo ""

# Intentar usar localhost.run
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run

# Si falla, sugerir Ngrok
echo ""
echo "Si lo anterior falló, por favor instala Ngrok (https://ngrok.com/download) y ejecuta:"
echo "ngrok http 3000"
