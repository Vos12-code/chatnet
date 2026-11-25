// web/src/types/index.ts

export interface Usuario {
  nombre: string;
}

export interface Mensaje {
  emisor: string;
  receptor: string;
  contenido: string;
  timestamp: string;
}

export type EstadoConexion = 'desconectado' | 'conectando' | 'conectado';