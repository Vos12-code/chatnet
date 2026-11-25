const net = require('net');
const comandos = require('./comandos');
const conexiones = require('./conexiones');

const PUERTO_TCP = process.env.PUERTO_TCP || 5000;

function iniciarTCP() {
  const server = net.createServer((socket) => {
    console.log(`[TCP] Cliente conectado desde ${socket.remoteAddress}:${socket.remotePort}`);
    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();
      let idx;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const linea = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);

        if (linea.trim()) {
          const respuestas = await comandos.procesar(linea, socket, 'tcp');
          respuestas.forEach(r => socket.write(r));
        }
      }
    });

    socket.on('close', () => {
      for (const usuario of conexiones.listar()) {
        const info = conexiones.obtener(usuario);
        if (info && info.socket === socket) conexiones.eliminar(usuario);
      }
      console.log('[TCP] Cliente desconectado');
    });

    socket.on('error', (err) => console.error('[TCP] Error:', err.message));
  });

  server.listen(PUERTO_TCP, '0.0.0.0', () => {
    console.log(`[TCP] Servidor escuchando en puerto ${PUERTO_TCP}`);
  });

  return server;
}

module.exports = { iniciarTCP };