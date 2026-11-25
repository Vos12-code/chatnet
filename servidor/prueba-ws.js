// servidor/prueba-ws.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5001');

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket');
  ws.send('LOGIN|zobeida|pass456\n');
});

ws.on('message', (data) => {
  console.log('📩 Recibido:', data.toString().trim());
  ws.send('LISTAR\n');
  setTimeout(() => ws.close(), 1000);
});

ws.on('close', () => console.log('🔌 Desconectado'));
ws.on('error', (err) => console.error('❌ Error:', err.message));