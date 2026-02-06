import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { WebSocketServer } from 'ws';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';
import * as mediasoup from 'mediasoup';
import { initMediasoup, createRouter, createWebRtcTransport } from './mediasoup-config';
import authRoutes from './routes/authRoutes';
import { initDatabase } from './database';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// 1. Socket.IO (Signaling)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

interface RoomUser {
  socketId: string;
  username: string;
  color?: string;
  joinedAt: number;
  isHost: boolean;
}

interface PeerState {
  transports: Map<string, mediasoup.types.WebRtcTransport>;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
}

const rooms = new Map<string, Set<string>>();
const users = new Map<string, RoomUser>();

// Mediasoup State
let worker: any;
const roomRouters = new Map<string, mediasoup.types.Router>();
const peerStates = new Map<string, PeerState>();

// Inicializar Mediasoup y Base de datos
(async () => {
  try {
    await initDatabase();
    worker = await initMediasoup();
    console.log('Mediasoup initialized successfully');
  } catch (err) {
    console.error('Failed to init Mediasoup or DB:', err);
  }
})();

io.on('connection', (socket: Socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);

  // Inicializar estado del peer
  peerStates.set(socket.id, {
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
  });

  socket.on('join-room', async ({ roomId, username, color }: { roomId: string; username: string, color?: string }, callback) => {
    console.log(`[Socket.IO] User ${username} (${socket.id}) joining room ${roomId}`);
    
    socket.join(roomId);
    
    // Determine if this is the first user in the room
    const isFirstUser = !rooms.has(roomId) || rooms.get(roomId)?.size === 0;
    
    const newUser: RoomUser = {
      socketId: socket.id,
      username,
      color,
      joinedAt: Date.now(),
      isHost: isFirstUser
    };

    users.set(socket.id, newUser);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
      // Crear Router de Mediasoup para la sala si no existe
      if (worker && !roomRouters.has(roomId)) {
        try {
          const router = await createRouter();
          roomRouters.set(roomId, router);
          console.log(`[Mediasoup] Router created for room ${roomId}`);
        } catch (e) {
          console.error('Error creating router:', e);
        }
      }
    }
    rooms.get(roomId)?.add(socket.id);

    socket.to(roomId).emit('user-joined', newUser);

    const roomUsers = Array.from(rooms.get(roomId) || []).map(id => users.get(id)).filter(Boolean) as RoomUser[];
    if (callback) callback({ peers: roomUsers });
  });

  // --- Chat System ---
  socket.on('send-message', ({ roomId, message, username, color, fileData }) => {
    const timestamp = new Date().toISOString();
    const chatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: username,
      text: message,
      timestamp,
      color,
      type: fileData ? 'file' : 'text',
      fileData
    };
    
    // Emitir a todos en la sala incluyéndose a sí mismo para consistencia
    io.to(roomId).emit('chat-message', chatMessage);
  });

  // --- Mediasoup Signaling ---

  socket.on('getRouterRtpCapabilities', ({ roomId }, callback) => {
    const router = roomRouters.get(roomId);
    if (router) {
      callback({ rtpCapabilities: router.rtpCapabilities });
    } else {
      callback({ error: 'Router not found' });
    }
  });

  socket.on('createWebRtcTransport', async ({ roomId }, callback) => {
    const router = roomRouters.get(roomId);
    if (!router) return callback({ error: 'Router not found' });

    try {
      const transport = await createWebRtcTransport(router);
      const peerState = peerStates.get(socket.id);
      peerState?.transports.set(transport.id, transport);

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        }
      });
    } catch (error) {
      console.error('createWebRtcTransport error:', error);
      callback({ error: error });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
    const peerState = peerStates.get(socket.id);
    const transport = peerState?.transports.get(transportId);
    if (!transport) return callback({ error: 'Transport not found' });

    await transport.connect({ dtlsParameters });
    callback({});
  });

  socket.on('produce', async ({ transportId, kind, rtpParameters, appData }, callback) => {
    const peerState = peerStates.get(socket.id);
    const transport = peerState?.transports.get(transportId);
    if (!transport) return callback({ error: 'Transport not found' });

    try {
      const producer = await transport.produce({ kind, rtpParameters, appData });
      peerState?.producers.set(producer.id, producer);

      // Notificar a otros en la sala
      const user = users.get(socket.id);
      // Hack: obtener roomId de rooms map (ineficiente pero funcional para MVP)
      let roomId = '';
      for (const [rId, parts] of rooms.entries()) {
        if (parts.has(socket.id)) {
          roomId = rId;
          break;
        }
      }

      if (roomId) {
        socket.to(roomId).emit('new-producer', {
          producerId: producer.id,
          socketId: socket.id,
          username: user?.username,
          kind: producer.kind,
          appData: producer.appData
        });
      }

      callback({ id: producer.id });
    } catch (error) {
      callback({ error: error });
    }
  });


  socket.on('consume-transport', async ({ roomId, transportId, producerId, rtpCapabilities }, callback) => {
    const router = roomRouters.get(roomId);
    const peerState = peerStates.get(socket.id);
    const transport = peerState?.transports.get(transportId);

    if (!router || !transport) return callback({ error: 'Router or Transport not found' });

    // Buscar el producer para obtener su appData
    let producer: mediasoup.types.Producer | undefined;
    for (const ps of peerStates.values()) {
      if (ps.producers.has(producerId)) {
        producer = ps.producers.get(producerId);
        break;
      }
    }

    if (!producer) return callback({ error: 'Producer not found' });

    try {
      const consumer = await transport.consume({
        producerId,
        rtpCapabilities,
        paused: true, // Empezar pausado
        appData: producer.appData, // Copiar appData (source: 'screen' etc)
      });

      peerState?.consumers.set(consumer.id, consumer);
      
      // Manejar cierre
      consumer.on('transportclose', () => {
        peerState?.consumers.delete(consumer.id);
      });
      
      consumer.on('producerclose', () => {
        peerState?.consumers.delete(consumer.id);
        socket.emit('consumer-closed', { consumerId: consumer.id });
      });

      callback({
        params: {
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          appData: consumer.appData,
        }
      });
      
      // Reanudar
      await consumer.resume();

    } catch (error) {
      console.error('Consume error:', error);
      callback({ error: error });
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
    const user = users.get(socket.id);
    const peerState = peerStates.get(socket.id);

    // Limpiar recursos Mediasoup
    peerState?.transports.forEach(t => t.close());
    peerStates.delete(socket.id);
    
    if (user) {
      rooms.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);
          
          if (participants.size === 0) {
            rooms.delete(roomId);
            const router = roomRouters.get(roomId);
            router?.close();
            roomRouters.delete(roomId);
          } else {
            // Handle Host Migration
            if (user.isHost) {
              const remainingUsers = Array.from(participants)
                .map(id => users.get(id))
                .filter((u): u is RoomUser => !!u)
                .sort((a, b) => a.joinedAt - b.joinedAt);
              
              if (remainingUsers.length > 0) {
                const newHost = remainingUsers[0];
                newHost.isHost = true;
                users.set(newHost.socketId, newHost);
                
                console.log(`[Socket.IO] Host migrated to ${newHost.username} (${newHost.socketId}) in room ${roomId}`);
                io.to(roomId).emit('host-updated', { newHostSocketId: newHost.socketId });
              }
            }

            io.to(roomId).emit('user-left', { socketId: socket.id });
          }
        }
      });
      users.delete(socket.id);
    }
  });
});

// 2. Yjs WebSocket Server
// Usamos una ruta específica '/yjs' para evitar conflictos con Socket.IO
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn, req) => {
  console.log('[Yjs] Connection established');
  setupWSConnection(conn, req, { docName: req.url?.slice(1).split('?')[0] || 'default' });
});

// Interceptar upgrade requests
httpServer.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  
  // Si la ruta empieza con /yjs, lo maneja el WebSocketServer de Yjs
  // El cliente se conectará a ws://localhost:3000/yjs/ROOM_ID
  if (url.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // Si no, dejamos que otros (como Socket.IO) lo manejen si es necesario
    // Socket.IO maneja su propio upgrade internamente via engine.io adjunto al httpServer
  }
});


const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`- Socket.IO: ws://localhost:${PORT}`);
  console.log(`- Yjs: ws://localhost:${PORT}/yjs`);
});
