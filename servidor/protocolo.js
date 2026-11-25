// servidor/protocolo.js

const SEPARADOR = '|';
const TERMINADOR = '\n';

function parsear(linea) {
  const limpia = linea.trim();
  if (!limpia) return null;
  const partes = limpia.split(SEPARADOR);
  const comando = partes[0].toUpperCase();
  const args = partes.slice(1);
  return { comando, args };
}

function construir(comando, ...args) {
  return [comando, ...args].join(SEPARADOR) + TERMINADOR;
}

module.exports = { parsear, construir, SEPARADOR, TERMINADOR };