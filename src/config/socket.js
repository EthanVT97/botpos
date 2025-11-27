const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO server
 */
function initializeSocket(server) {
  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Configure allowed origins
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Production-optimized settings for Render
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    // Allow long polling fallback
    allowEIO3: true,
    // Path for WebSocket connections
    path: '/socket.io/'
  });

  // Heartbeat mechanism (always enabled for connection stability)
  const heartbeatInterval = setInterval(() => {
    io.sockets.sockets.forEach((socket) => {
      if (socket.connected) {
        socket.emit('ping');
      }
    });
  }, 25000); // Every 25 seconds (Render requires < 30s)

  // Store interval for cleanup
  io.heartbeatInterval = heartbeatInterval;

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

    // Handle pong response
    socket.on('pong', () => {
      // Client is alive
    });

    // Join customer room for private messages
    socket.on('join:customer', (customerId) => {
      socket.join(`customer:${customerId}`);
      console.log(`Customer ${customerId} joined room`);
    });

    // Join admin room for receiving all messages
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`Admin joined room`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}

/**
 * Emit new message to relevant clients
 */
function emitNewMessage(message, customerId) {
  if (!io) return;

  // Send to admin dashboard
  io.to('admin').emit('chat:new-message', message);

  // Send to specific customer if they're connected
  io.to(`customer:${customerId}`).emit('chat:new-message', message);
}

/**
 * Emit message read status update
 */
function emitMessageRead(customerId, messageIds) {
  if (!io) return;

  io.to('admin').emit('chat:messages-read', { customerId, messageIds });
  io.to(`customer:${customerId}`).emit('chat:messages-read', { customerId, messageIds });
}

/**
 * Emit unread count update
 */
function emitUnreadCountUpdate(count) {
  if (!io) return;

  io.to('admin').emit('chat:unread-count', { total: count });
}

/**
 * Emit session update
 */
function emitSessionUpdate(session) {
  if (!io) return;

  io.to('admin').emit('chat:session-update', session);
}

module.exports = {
  initializeSocket,
  emitNewMessage,
  emitMessageRead,
  emitUnreadCountUpdate,
  emitSessionUpdate,
  getIO: () => io
};
