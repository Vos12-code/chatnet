// servidor/index.js

require('dotenv').config();

const { iniciarTCP } = require('./tcpServer');
const { iniciarWS } = require('./wsServer');

console.log('=================================');
console.log('  ChatNet - Servidor de Mensajería');
console.log('=================================');

iniciarTCP();
iniciarWS();

console.log('[INFO] Servidor listo. Esperando conexiones...');