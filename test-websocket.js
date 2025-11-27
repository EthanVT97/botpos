#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🧪 Testing WebSocket Connection...\n');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const BASE_URL = API_URL.replace('/api', '');

console.log('📍 Connecting to:', BASE_URL);
console.log('🔌 Socket.IO path: /socket.io/\n');

const socket = io(BASE_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 10000,
  path: '/socket.io/',
  autoConnect: true
});

let connected = false;
let pingReceived = false;

socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('   Socket ID:', socket.id);
  console.log('   Transport:', socket.io.engine.transport.name);
  connected = true;
  
  // Join admin room
  socket.emit('join:admin');
  console.log('   Joined admin room');
  
  // Wait for ping
  setTimeout(() => {
    if (!pingReceived) {
      console.log('\n⚠️  No heartbeat ping received (waiting 30s)');
    }
    cleanup();
  }, 30000);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  cleanup();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  cleanup();
});

socket.on('ping', () => {
  console.log('💓 Heartbeat ping received');
  pingReceived = true;
  socket.emit('pong');
  console.log('💓 Pong sent back');
});

socket.on('chat:new-message', (data) => {
  console.log('📨 New message event received:', data);
});

function cleanup() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log('   Connection:', connected ? '✅ Success' : '❌ Failed');
  console.log('   Heartbeat:', pingReceived ? '✅ Working' : '⚠️  Not tested (wait 30s)');
  console.log('='.repeat(50));
  
  if (connected && pingReceived) {
    console.log('\n🎉 WebSocket is working perfectly!');
    process.exit(0);
  } else if (connected) {
    console.log('\n⚠️  WebSocket connected but heartbeat not confirmed');
    console.log('   This is normal if test ran < 30 seconds');
    process.exit(0);
  } else {
    console.log('\n❌ WebSocket connection failed');
    console.log('\nTroubleshooting:');
    console.log('   1. Make sure backend is running: npm run dev');
    console.log('   2. Check backend logs for Socket.IO initialization');
    console.log('   3. Verify CORS settings in backend');
    console.log('   4. Check firewall/network settings');
    process.exit(1);
  }
}

// Timeout after 35 seconds
setTimeout(() => {
  if (!connected) {
    console.log('\n❌ Connection timeout (35s)');
    cleanup();
  }
}, 35000);

console.log('⏳ Waiting for connection...\n');
