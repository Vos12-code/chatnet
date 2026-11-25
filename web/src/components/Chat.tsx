// web/src/components/Chat.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatSocket } from '@/lib/socket';
import { Usuario, Mensaje } from '@/types';
import { Send, LogOut, Users } from 'lucide-react';

interface ChatProps {
  usuario: Usuario;
  socket: ChatSocket;
  onLogout: () => void;
}

export default function Chat({ usuario, socket, onLogout }: ChatProps) {
  const [usuariosConectados, setUsuariosConectados] = useState<string[]>([]);
  const [receptor, setReceptor] = useState<string>('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const receptorRef = useRef<string>('');

  useEffect(() => {
    receptorRef.current = receptor;
  }, [receptor]);

  useEffect(() => {
    // Pequeño retraso para asegurar que los listeners estén listos
    const timer = setTimeout(() => {
      socket.enviar('LISTAR');
    }, 100); 

    const handleListar = (data: string) => {
      const lista = data.split('|')[0].split(',').filter(Boolean);
      const otros = lista.filter((u: string) => u !== usuario.nombre);
      setUsuariosConectados(otros);
      if (!receptorRef.current && otros.length > 0) {
        setReceptor(otros[0]);
      }
    };

    const handleMensaje = (data: string) => {
      // Dividimos solo por los primeros 3 pipes para no romper el contenido si tiene '|'
      const partes = data.split('|');
      const emisor = partes[0];
      const rec = partes[1];
      const contenido = partes[2];
      const timestamp = partes[3]; // El timestamp viene al final

      const actual = receptorRef.current;
      if (
        (emisor === usuario.nombre && rec === actual) ||
        (emisor === actual && rec === usuario.nombre)
      ) {
        setMensajes(prev => [...prev, { emisor, receptor: rec, contenido, timestamp }]);
      }
    };

    const handleHistorial = (data: string) => {
      try {
        const json = data.split('|').slice(0).join('|');
        const arr: Mensaje[] = JSON.parse(json);
        setMensajes(arr);
      } catch (e) {
        console.error('Error parseando historial', e);
      }
    };

    socket.on('LISTAR_OK', handleListar);
    socket.on('MENSAJE', handleMensaje);
    socket.on('HISTORIAL_OK', handleHistorial);

    return () => {
      clearTimeout(timer); // <-- Añade esto
      socket.off('LISTAR_OK', handleListar);
      socket.off('MENSAJE', handleMensaje);
      socket.off('HISTORIAL_OK', handleHistorial);
    };
  }, [socket, usuario.nombre]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !receptor) return;
    socket.enviar('ENVIAR', usuario.nombre, receptor, texto);
    setTexto('');
  };

  const cambiarReceptor = (nuevo: string) => {
    setReceptor(nuevo);
    setMensajes([]);
    socket.enviar('HISTORIAL', usuario.nombre, nuevo);
  };

  // Función auxiliar para formatear la hora de forma segura
  const formatearHora = (timestamp: string) => {
    try {
      const fecha = new Date(timestamp);
      if (isNaN(fecha.getTime())) return new Date().toLocaleTimeString();
      return fecha.toLocaleTimeString();
    } catch {
      return new Date().toLocaleTimeString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">ChatNet</span>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-400 hover:text-red-500 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Conectado como</div>
          <div className="font-medium text-gray-800">{usuario.nombre}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 px-2 mb-2">
            Usuarios en línea ({usuariosConectados.length})
          </div>
          {usuariosConectados.length === 0 && (
            <div className="text-xs text-gray-400 px-2">Nadie más conectado</div>
          )}
          {usuariosConectados.map((u) => (
            <button
              key={u}
              onClick={() => cambiarReceptor(u)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                receptor === u
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {receptor ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="font-semibold text-gray-800">Chat con {receptor}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mensajes.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-8">
                  No hay mensajes todavía. ¡Envía el primero!
                </div>
              )}
              {mensajes.map((m, i) => {
                const esMio = m.emisor === usuario.nombre;
                return (
                  <div
                    key={i}
                    className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        esMio
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">{m.contenido}</div>
                      <div
                        className={`text-xs mt-1 ${
                          esMio ? 'text-indigo-200' : 'text-gray-400'
                        }`}
                      >
                        {formatearHora(m.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef} />
            </div>

            <form onSubmit={enviarMensaje} className="p-4 border-t border-gray-200 bg-white flex gap-2">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Selecciona un usuario para chatear
          </div>
        )}
      </div>
    </div>
  );
}