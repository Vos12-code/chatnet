// servidor/prueba-tcp.js
const net = require('net');

const socket = net.createConnection({ port: 5000, host: 'localhost' }, () => {
  console.log('✅ Conectado al servidor TCP');
  socket.write('LOGIN|denny|pass123\n');
});

socket.on('data', (data) => {
  console.log('📩 Recibido:', data.toString().trim());
  // Después del login, pedir lista
  socket.write('LISTAR\n');
  // Cerrar después de 1 segundo
  setTimeout(() => socket.end(), 1000);
});

socket.on('close', () => console.log('🔌 Desconectado'));
socket.on('error', (err) => console.error('❌ Error:', err.message));
