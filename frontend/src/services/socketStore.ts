import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  socketId: string;
  username: string;
  color?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  color?: string;
  type?: 'text' | 'file';
  fileData?: {
    name: string;
    size: number;
    type: string;
    data: string; // base64
  };
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  peers: User[];
  messages: ChatMessage[];
  connect: () => void;
  joinRoom: (roomId: string, username: string, color?: string) => Promise<void>;
  sendMessage: (roomId: string, message: string, username: string, color?: string, fileData?: ChatMessage['fileData']) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  peers: [],
  messages: [],

  connect: () => {
    if (get().socket) return;

    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      set({ isConnected: false, peers: [], messages: [] });
    });

    socket.on('user-joined', (user: User) => {
      console.log('User joined:', user);
      set((state) => ({
        peers: [...state.peers, user]
      }));
    });

    socket.on('chat-message', (message: ChatMessage) => {
      set((state) => ({
        messages: [...state.messages, message]
      }));
    });

    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      console.log('User left:', socketId);
      set((state) => ({
        peers: state.peers.filter(p => p.socketId !== socketId)
      }));
    });

    set({ socket });
  },

  joinRoom: (roomId: string, username: string, color?: string) => {
    return new Promise((resolve) => {
      const socket = get().socket;
      if (!socket) return;

      socket.emit('join-room', { roomId, username, color }, (response: { peers: User[] }) => {
        set({ peers: response.peers });
        resolve();
      });
    });
  },

  sendMessage: (roomId: string, message: string, username: string, color?: string, fileData?: ChatMessage['fileData']) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('send-message', { roomId, message, username, color, fileData });
    }
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, peers: [] });
    }
  }
}));
