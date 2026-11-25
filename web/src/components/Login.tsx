// web/src/components/Login.tsx

'use client';

import { useState } from 'react';
import { ChatSocket } from '@/lib/socket';
import { Usuario } from '@/types';

interface LoginProps {
  onLogin: (usuario: Usuario, socket: ChatSocket) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001';
      const socket = new ChatSocket(wsUrl);
      await socket.conectar();

      let respondido = false;

      socket.on('LOGIN_OK', (data) => {
        if (respondido) return;
        respondido = true;
        const [usuario] = data.split('|');
        onLogin({ nombre: usuario }, socket);
        setCargando(false);
      });

      socket.on('LOGIN_FAIL', (motivo) => {
        if (respondido) return;
        respondido = true;
        setError(motivo || 'Credenciales inválidas');
        setCargando(false);
        socket.desconectar();
      });

      socket.enviar('LOGIN', nombre, password);

      setTimeout(() => {
        if (!respondido) {
          respondido = true;
          setError('Tiempo de espera agotado');
          setCargando(false);
          socket.desconectar();
        }
      }, 5000);
    } catch (err) {
      setError('No se pudo conectar al servidor');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ChatNet</h1>
          <p className="text-gray-500 mt-2">Sistema Distribuido de Mensajería</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              placeholder="denny"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Conectando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-400 text-center">
          Usuarios de prueba: denny/pass123, zobeida/pass456, oscar/pass789
        </div>
      </div>
    </div>
  );
}