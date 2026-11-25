// servidor/comandos.js

const protocolo = require('./protocolo');
const conexiones = require('./conexiones');
const supabase = require('./supabase');

async function procesar(linea, socket, tipo) {
  const parsed = protocolo.parsear(linea);
  if (!parsed) return [];

  const { comando, args } = parsed;
  const respuestas = [];

  switch (comando) {
    case 'LOGIN': {
      const [usuario, password] = args;
      
      console.log(`[LOGIN] Intentando conectar a Supabase para el usuario: ${usuario}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('username, password')
        .eq('username', usuario)
        .single();

      // NUEVOS LOGS PARA DEPURAR
      if (error) {
        console.error(' ERROR DE SUPABASE:', error.message);
        console.error('Detalles:', error.details);
      }
      if (!data) {
        console.log(' NO SE ENCONTRÓ EL USUARIO EN LA BD');
      } else {
        console.log(' Usuario encontrado. Contraseña en BD:', data.password, '| Contraseña ingresada:', password);
      }

      if (error || !data || data.password !== password) {
        respuestas.push(protocolo.construir('LOGIN_FAIL', 'Credenciales inválidas'));
        break;
      }

      const token = `token_${usuario}_${Date.now()}`;
      conexiones.registrar(usuario, socket, tipo);
      respuestas.push(protocolo.construir('LOGIN_OK', usuario, token));

      // Avisar a todos los conectados
      const lista = conexiones.listar().join(',');
      for (const u of conexiones.listar()) {
        if (u !== usuario) {
          const info = conexiones.obtener(u);
          if (info) enviarA(info.socket, info.tipo, protocolo.construir('LISTAR_OK', lista));
        }
      }
      break;
    }

    case 'LOGOUT': {
      const [usuario] = args;
      conexiones.eliminar(usuario);
      respuestas.push(protocolo.construir('LOGOUT_OK', usuario));
      
      const lista = conexiones.listar().join(',');
      for (const u of conexiones.listar()) {
        if (u !== usuario) {
          const info = conexiones.obtener(u);
          if (info) enviarA(info.socket, info.tipo, protocolo.construir('LISTAR_OK', lista));
        }
      }
      break;
    }

    case 'ENVIAR': {
      const [emisor, receptor, ...resto] = args;
      const contenido = resto.join('|');
      const timestamp = new Date().toISOString();

      if (!conexiones.estaConectado(emisor)) {
        respuestas.push(protocolo.construir('ERROR', '401', 'Emisor no conectado'));
        break;
      }

      // 1. Guardar en Supabase
      const { error } = await supabase
        .from('mensajes')
        .insert([{ emisor, receptor, contenido, timestamp }]);

      if (error) {
        console.error('Error al guardar mensaje:', error.message);
        respuestas.push(protocolo.construir('ERROR', '500', 'No se pudo guardar el mensaje'));
        break;
      }

      // 2. Eco al emisor
      const destinoEmisor = conexiones.obtener(emisor);
      if (destinoEmisor) {
        const msgEmisor = protocolo.construir('MENSAJE', emisor, receptor, contenido, timestamp);
        enviarA(destinoEmisor.socket, destinoEmisor.tipo, msgEmisor);
      }

      // 3. Entrega al receptor
      const destinoReceptor = conexiones.obtener(receptor);
      if (destinoReceptor) {
        const msgReceptor = protocolo.construir('MENSAJE', emisor, receptor, contenido, timestamp);
        enviarA(destinoReceptor.socket, destinoReceptor.tipo, msgReceptor);
      }
      break;
    }

    case 'HISTORIAL': {
      const [usuario1, usuario2] = args;
      
      // Consultar historial en Supabase
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .or(`and(emisor.eq.${usuario1},receptor.eq.${usuario2}),and(emisor.eq.${usuario2},receptor.eq.${usuario1})`)
        .order('timestamp', { ascending: true });

      if (error) {
        respuestas.push(protocolo.construir('ERROR', '500', 'Error al recuperar historial'));
        break;
      }

      const json = JSON.stringify(data || []);
      respuestas.push(protocolo.construir('HISTORIAL_OK', json));
      break;
    }

    case 'PRESENCIA': {
      const [usuario] = args;
      const estado = conexiones.estaConectado(usuario) ? 'conectado' : 'desconectado';
      respuestas.push(protocolo.construir('PRESENCIA_OK', usuario, estado));
      break;
    }

    case 'LISTAR': {
      const lista = conexiones.listar().join(',');
      respuestas.push(protocolo.construir('LISTAR_OK', lista));
      break;
    }

    default:
      respuestas.push(protocolo.construir('ERROR', '400', `Comando desconocido: ${comando}`));
  }

  return respuestas;
}

function enviarA(socket, tipo, mensaje) {
  try {
    if (tipo === 'tcp') socket.write(mensaje);
    else if (tipo === 'ws') socket.send(mensaje);
  } catch (err) {
    console.error('[ERROR ENVÍO]', err.message);
  }
}

module.exports = { procesar, enviarA };