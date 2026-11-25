// servidor/conexiones.js

const conexiones = new Map();

function registrar(usuario, socket, tipo) {
  conexiones.set(usuario, { socket, tipo, estado: 'conectado' });
  console.log(`[CONEXIÓN] ${usuario} conectado vía ${tipo}. Total: ${conexiones.size}`);
}

function eliminar(usuario) {
  conexiones.delete(usuario);
  console.log(`[DESCONEXIÓN] ${usuario} desconectado. Total: ${conexiones.size}`);
}

function obtener(usuario) {
  return conexiones.get(usuario);
}

function estaConectado(usuario) {
  return conexiones.has(usuario);
}

function listar() {
  return Array.from(conexiones.keys());
}

module.exports = { registrar, eliminar, obtener, estaConectado, listar };