# 🌊 BoardWave

> **Breaking the distance barrier with Glassmorphism & Real-Time Sync.**
> 
> *A modern, high-performance video conferencing platform built for the future of remote collaboration.*

![BoardWave Banner](https://via.placeholder.com/1200x400/1A73E8/ffffff?text=BoardWave+Experience)
*(Replace with actual screenshot)*

## 🚀 Overview

**BoardWave** is not just another video chat app. It's a fully integrated collaborative workspace engineered for performance and usability. By leveraging a **Selective Forwarding Unit (SFU)** architecture, we deliver crystal-clear video with minimal bandwidth, while our **CRDT-powered whiteboard** ensures every stroke is synchronized instantly across all clients.

Whether you're brainstorming designs, debugging code, or just catching up, BoardWave provides a seamless, glass-styled environment to get work done.

---

## 🛠️ Tech Stack

### Frontend (The Beauty)
- **React 18 + TypeScript**: Type-safe, component-driven UI.
- **Vite**: Blazing fast build tool and HMR.
- **Tailwind CSS**: Custom "Glassmorphism" design system.
- **Zustand**: Atomic state management for media and UI.
- **Mediasoup Client**: Robust WebRTC handling.

### Backend (The Beast)
- **Node.js + Express**: Scalable application server.
- **Mediasoup**: Powerful SFU router for multi-party video.
- **Socket.IO**: Real-time signaling and events.
- **Yjs + WebSocket**: Conflict-free replicated data types (CRDT) for the whiteboard.
- **SQLite**: Lightweight, efficient user data management.

### Infrastructure
- **Docker**: Containerized for consistency.
- **AWS EC2**: Production-grade hosting.
- **Caddy**: Automatic HTTPS and reverse proxying.

---

## ✨ Key Features

### 🎥 Scalable Video Conferencing
Unlike traditional mesh networks that kill bandwidth, BoardWave uses an **SFU architecture**. The server acts as a router, receiving one stream from each user and forwarding it to others, significantly reducing client-side CPU and network load.

### 🎨 Infinite Real-Time Whiteboard
Powered by **Yjs**, our whiteboard supports concurrent editing without conflicts. Draw, sketch, and brainstorm with zero latency. It's like being in the same room.

### 🖥️ Smart Screen Sharing
Seamlessly switch between camera and screen share. The UI adapts automatically, giving focus to the content that matters.

### 💬 Rich Chat & File Sharing
Send text messages or share files instantly. Drag, drop, and done.

### 🔐 Secure & Persistent
- **JWT Authentication**: Secure session management.
- **Persistent Rooms**: Your meeting space is always there when you need it.

---

## 🧩 Engineering Highlights

> *Things I'm proud of solving:*

*   **Race Condition Handling**: Implemented robust state locking in `mediaStore` to prevent audio/video stream conflicts during rapid toggling.
*   **Mobile Responsiveness**: Custom grid layouts that adapt from 4K desktops to mobile screens without breaking the immersive glass UI.
*   **CRDT Synchronization**: Integrated `y-websocket` alongside standard `socket.io` to handle high-frequency whiteboard updates independently of signaling traffic.

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/boardwave.git
    cd boardwave
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Run Development Servers**
    *   Backend: `npm run dev` (Port 3000)
    *   Frontend: `npm run dev` (Port 5173)

---

## 👨‍💻 Author

**Mateo** - *Full Stack Developer*

*Passionate about building scalable real-time applications and intuitive user interfaces.*

---

*Built with ❤️ and ☕ using the T3-ish Stack.*
