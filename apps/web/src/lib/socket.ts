import { io, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@resqgrid/types';

let socket: Socket | null = null;

function getSocketUrl(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) {
    try {
      return new URL(import.meta.env.VITE_API_URL).origin;
    } catch {
      // fallback
    }
  }
  return '/';
}

export function getSocket(): Socket {
  if (!socket) {
    const wsUrl = getSocketUrl();
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to ResQGrid Real-Time Event Broker');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from ResQGrid Event Broker');
    });
  }

  return socket;
}

export { WS_EVENTS };
