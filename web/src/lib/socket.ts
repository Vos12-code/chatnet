// web/src/lib/socket.ts

type Callback = (data: string) => void;

export class ChatSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Callback[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  conectar(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Conectado');
          this.emit('conectado', 'ok');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const texto = event.data.toString();
          const lineas = texto.split('\n').filter((l: string) => l.trim());

          lineas.forEach((linea: string) => {
            const [comando, ...args] = linea.split('|');
            const cmd = comando.toUpperCase();
            console.log('[WS] Recibido:', cmd, args);
            this.emit(cmd, args.join('|'));
            this.emit('*', linea);
          });
        };

        this.ws.onclose = () => {
          console.log('[WS] Desconectado');
          this.emit('desconectado', 'ok');
        };

        this.ws.onerror = (err) => {
          console.error('[WS] Error:', err);
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  enviar(comando: string, ...args: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WS] No conectado');
      return;
    }
    const linea = [comando, ...args].join('|') + '\n';
    this.ws.send(linea);
  }

  on(evento: string, callback: Callback) {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, []);
    }
    this.listeners.get(evento)!.push(callback);
  }

  off(evento: string, callback: Callback) {
    const arr = this.listeners.get(evento);
    if (!arr) return;
    this.listeners.set(evento, arr.filter(cb => cb !== callback));
  }

  private emit(evento: string, data: string) {
    const arr = this.listeners.get(evento);
    if (arr) arr.forEach(cb => cb(data));
  }

  desconectar() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}