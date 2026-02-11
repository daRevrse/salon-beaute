import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.tenant_id) {
      // Connect to socket server (same host as API, without /api path)
      const socketUrl = 'http://192.168.1.77:5000';

      const newSocket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        console.log('⚡ Socket connecté:', newSocket.id);
        newSocket.emit('join_tenant', user.tenant_id);
      });

      newSocket.on('joined', (data) => {
        console.log('✅ Room rejointe:', data.tenantId);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Socket déconnecté');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
