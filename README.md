# 🌊 BoardWave

> **Rompiendo la barrera de la distancia con Glassmorphism y Sincronización en Tiempo Real.**
> 
> *Una plataforma moderna de videoconferencia de alto rendimiento construida para el futuro de la colaboración remota.*

![BoardWave Banner](https://via.placeholder.com/1200x400/1A73E8/ffffff?text=Experiencia+BoardWave)
*(Reemplazar con una captura de pantalla real)*

## 🚀 Descripción General

**BoardWave** no es solo otra aplicación de videochat. Es un espacio de trabajo colaborativo totalmente integrado, diseñado para el rendimiento y la usabilidad. Aprovechando una arquitectura de **Unidad de Reenvío Selectivo (SFU)**, ofrecemos video nítido con un ancho de banda mínimo, mientras que nuestra **pizarra impulsada por CRDT** asegura que cada trazo se sincronice instantáneamente en todos los clientes.

Ya sea que estés diseñando, depurando código o simplemente poniéndote al día, BoardWave ofrece un entorno fluido y con estilo "glass" para hacer el trabajo.

---

## 🛠️ Stack Tecnológico

### Frontend (La Belleza)
- **React 18 + TypeScript**: UI basada en componentes y tipado seguro.
- **Vite**: Herramienta de construcción ultra rápida y HMR.
- **Tailwind CSS**: Sistema de diseño personalizado "Glassmorphism".
- **Zustand**: Gestión de estado atómica para medios y UI.
- **Mediasoup Client**: Manejo robusto de WebRTC.

### Backend (La Bestia)
- **Node.js + Express**: Servidor de aplicaciones escalable.
- **Mediasoup**: Potente router SFU para video multiparte.
- **Socket.IO**: Señalización y eventos en tiempo real.
- **Yjs + WebSocket**: Tipos de datos replicados libres de conflictos (CRDT) para la pizarra.
- **SQLite**: Gestión de datos de usuario ligera y eficiente.

### Infraestructura
- **Docker**: Contenerizado para consistencia.
- **AWS EC2**: Alojamiento de grado de producción.
- **Caddy**: HTTPS automático y proxy inverso.

---

## ✨ Características Clave

### 🎥 Videoconferencia Escalable
A diferencia de las redes mesh tradicionales que saturan el ancho de banda, BoardWave utiliza una **arquitectura SFU**. El servidor actúa como un router, recibiendo un flujo de cada usuario y reenviándolo a los demás, reduciendo significativamente la carga de CPU y red en el cliente.

### 🎨 Pizarra Infinita en Tiempo Real
Impulsada por **Yjs**, nuestra pizarra soporta edición concurrente sin conflictos. Dibuja, boceta y haz lluvia de ideas con latencia cero. Es como estar en la misma habitación.

### 🖥️ Compartir Pantalla Inteligente
Cambia sin problemas entre la cámara y compartir pantalla. La interfaz se adapta automáticamente, dando foco al contenido que importa.

### 💬 Chat Enriquecido y Compartir Archivos
Envía mensajes de texto o comparte archivos al instante. Arrastrar, soltar y listo.

### 🔐 Seguro y Persistente
- **Autenticación JWT**: Gestión de sesiones segura.
- **Salas Persistentes**: Tu espacio de reunión siempre está ahí cuando lo necesitas.

---

## 🧩 Destacados de Ingeniería

> *Cosas que me enorgullece haber resuelto:*

*   **Manejo de Condiciones de Carrera**: Implementé un bloqueo de estado robusto en `mediaStore` para prevenir conflictos de flujos de audio/video durante cambios rápidos.
*   **Responsividad Móvil**: Layouts de grid personalizados que se adaptan desde escritorios 4K hasta pantallas móviles sin romper la interfaz inmersiva de vidrio.
*   **Sincronización CRDT**: Integré `y-websocket` junto con el estándar `socket.io` para manejar actualizaciones de pizarra de alta frecuencia independientemente del tráfico de señalización.

---

## 🏃‍♂️ Comenzando

### Requisitos Previos
- Node.js v18+
- npm o yarn

### Instalación

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/tuusuario/boardwave.git
    cd boardwave
    ```

2.  **Instalar Dependencias del Backend**
    ```bash
    cd backend
    npm install
    ```

3.  **Instalar Dependencias del Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Ejecutar Servidores de Desarrollo**
    *   Backend: `npm run dev` (Puerto 3000)
    *   Frontend: `npm run dev` (Puerto 5173)

---

## 👨‍💻 Autor

**Mateo** - *Desarrollador Full Stack*

*Apasionado por construir aplicaciones escalables en tiempo real e interfaces de usuario intuitivas.*

---

*Construido con ❤️ y ☕ usando el Stack T3-ish.*
