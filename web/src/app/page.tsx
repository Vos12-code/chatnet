// web/src/app/page.tsx

'use client';

import { useState } from 'react';
import Login from '@/components/Login';
import Chat from '@/components/Chat';
import { ChatSocket } from '@/lib/socket';
import { Usuario } from '@/types';

export default function Home() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [socket, setSocket] = useState<ChatSocket | null>(null);

  const handleLogin = (user: Usuario, sock: ChatSocket) => {
    setUsuario(user);
    setSocket(sock);
  };

    const handleLogout = () => {
    if (socket && usuario) {
      // 1. Enviamos el LOGOUT
      socket.enviar('LOGOUT', usuario.nombre);
      
      // 2. Esperamos 100ms para que el mensaje salga antes de cerrar
      setTimeout(() => {
        socket.desconectar();
      }, 100);
    }
    
    // 3. Actualizamos la pantalla inmediatamente (no espera el socket)
    setUsuario(null);
    setSocket(null);
  };

  if (!usuario || !socket) {
    return <Login onLogin={handleLogin} />;
  }

  return <Chat usuario={usuario} socket={socket} onLogout={handleLogout} />;
}