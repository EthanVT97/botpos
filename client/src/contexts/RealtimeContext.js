import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useNotification } from './NotificationContext';

const RealtimeContext = createContext(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [listeners, setListeners] = useState({});
  const notification = useNotification();

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Real-time connection established');
      setConnected(true);
      notification.success('Real-time sync connected', 3000);
    });

    socket.on('disconnect', () => {
      console.log('❌ Real-time connection lost');
      setConnected(false);
      notification.warning('Real-time sync disconnected', 3000);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      notification.success('Real-time sync reconnected', 3000);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Global event listeners
    socket.on('data:updated', (data) => {
      console.log('📊 Data updated:', data);
      if (data.message) {
        notification.info(data.message, 4000);
      }
    });

    socket.on('inventory:low-stock', (data) => {
      notification.warning(
        `Low stock alert: ${data.product_name} (${data.quantity} remaining)`,
        6000
      );
    });

    socket.on('order:new', (data) => {
      notification.info(`New order #${data.order_id} received`, 5000);
    });

    socket.on('order:completed', (data) => {
      notification.success(`Order #${data.order_id} completed`, 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return;

    socketRef.current.on(event, callback);
    
    setListeners(prev => ({
      ...prev,
      [event]: [...(prev[event] || []), callback]
    }));

    return () => {
      socketRef.current?.off(event, callback);
      setListeners(prev => ({
        ...prev,
        [event]: (prev[event] || []).filter(cb => cb !== callback)
      }));
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (!socketRef.current || !connected) {
      console.warn('Cannot emit: Socket not connected');
      return false;
    }

    socketRef.current.emit(event, data);
    return true;
  }, [connected]);

  const value = {
    connected,
    subscribe,
    emit,
    socket: socketRef.current
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeContext;
