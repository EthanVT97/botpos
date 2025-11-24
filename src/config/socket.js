const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO server
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

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
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
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
