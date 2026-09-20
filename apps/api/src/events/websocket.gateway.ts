import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WS_EVENTS } from '@resqgrid/types';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer, corsOrigin: string): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, mobile, server-to-server)
        if (!origin) return callback(null, true);

        // Allow wildcard or configured origins
        if (corsOrigin === '*' || !corsOrigin) return callback(null, true);

        const configured = corsOrigin.split(',').map((o) => o.trim());
        if (
          configured.includes(origin) ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.onrender.com')
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    socket.on('subscribe:incident', (incidentId: string) => {
      socket.join(`incident:${incidentId}`);
      console.log(`[WebSocket] Client ${socket.id} subscribed to incident:${incidentId}`);
    });

    socket.on('unsubscribe:incident', (incidentId: string) => {
      socket.leave(`incident:${incidentId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastEvent<T>(event: string, payload: T, incidentId?: string): void {
  if (!io) {
    console.warn(`[WebSocket] Attempted to broadcast ${event} but io is not initialized.`);
    return;
  }

  // Broadcast globally to all command center / admin listeners
  io.emit(event, payload);

  // If scoped to a specific incident, emit to that room as well
  if (incidentId) {
    io.to(`incident:${incidentId}`).emit(event, payload);
  }
}
