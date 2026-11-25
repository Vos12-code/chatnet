const { WebSocketServer } = require('ws');
const comandos = require('./comandos');
const conexiones = require('./conexiones');

const PUERTO_WS = process.env.PORT || process.env.PUERTO_WS || 5001;

function iniciarWS() {
  const wss = new WebSocketServer({ port: PUERTO_WS, host: '0.0.0.0' });
  console.log(`[WS] Servidor WebSocket escuchando en puerto ${PUERTO_WS}`);

  wss.on('connection', (ws) => {
    console.log('[WS] Cliente conectado');

    ws.on('message', async (data) => {
      const texto = data.toString();
      const lineas = texto.split('\n').filter(l => l.trim());

      for (const linea of lineas) {
        const respuestas = await comandos.procesar(linea, ws, 'ws');
        respuestas.forEach(r => ws.send(r));
      }
    });

    ws.on('close', () => {
      for (const usuario of conexiones.listar()) {
        const info = conexiones.obtener(usuario);
        if (info && info.socket === ws) conexiones.eliminar(usuario);
      }
      console.log('[WS] Cliente desconectado');
    });

    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  return wss;
}

module.exports = { iniciarWS };