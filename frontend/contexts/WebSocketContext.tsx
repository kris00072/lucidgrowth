'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gmailStatus: {
    isActive: boolean;
    expiration: Date | null;
    testEmail: string;
    testSubject: string;
  } | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  gmailStatus: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<WebSocketContextType['gmailStatus']>(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
      
      // Subscribe to updates
      socketInstance.emit('subscribe');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socketInstance.on('gmail:watch-started', (data) => {
      setGmailStatus(prev => prev ? { ...prev, expiration: data.expiration } : null);
    });

    socketInstance.on('gmail:token-refreshed', (data) => {
      console.log('Gmail token refreshed:', data.message);
      // You can add a toast notification here
    });

    socketInstance.on('gmail:re-auth-required', (data) => {
      console.error('Gmail re-authentication required:', data.message);
      // You can add a modal or notification here
    });

    socketInstance.on('connected', () => {
      console.log('WebSocket connection established');
    });

    socketInstance.on('subscribed', () => {
      console.log('Subscribed to email updates');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('gmail:watch-started');
      socketInstance.off('gmail:token-refreshed');
      socketInstance.off('gmail:re-auth-required');
      socketInstance.disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    gmailStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
