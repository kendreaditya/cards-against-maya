import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import { setupSocketHandlers } from './src/lib/socket-handlers';
import { getDb } from './src/lib/db';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : undefined,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize DB (seeds cards on first run)
  getDb();

  // Set up Socket.IO handlers
  setupSocketHandlers(io);

  // Let Next.js handle everything else
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Mode: ${dev ? 'development' : 'production'}`);
  });
});
