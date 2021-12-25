import SocketServer from 'socket.io';
import TelnetLib from 'telnetlib';
import { IOSocket, TelnetSocket } from './Socket';
import { emitter } from './ChainEmitter';

export class IOServer {
  constructor() {
    const server = SocketServer();

    server.on('connection', (sock) => {
      const socket = new IOSocket(sock);

      emitter.emit('$system', { type: '$socket:connection', socket });

      sock.on('disconnecting', (reason) => {
        emitter.emit('$system', { type: '$socket:disconnecting', socket, event: reason });
      });

      sock.on('disconnect', (reason) => {
        emitter.emit('$system', { type: '$socket:disconnect', socket, event: reason });
        socket.removeAllListeners();
      });

      sock.on('error', (error) => {
        emitter.emit('$system', { type: '$socket:error', socket, event: error });
      });

      sock.onAny((type, event) => {
        emitter.emit('$system', { type: `$socket:${type}`, socket, event });
      });
    });

    return server;
  }
}

export class TelnetServer {
  constructor() {
    const { GMCP, ECHO } = TelnetLib.options;

    return TelnetLib.createServer({ localOptions: [GMCP, ECHO] }, (sock) => {
      const socket = new TelnetSocket(sock);

      sock.on('negotiated', () => {
        emitter.emit('$system', { type: '$socket:connection', socket });
      });

      sock.on('data', (data) => {
        emitter.emit('$system', { type: '$socket:data', socket, event: data.toString('utf-8') });
      });

      sock.on('error', (error) => {
        emitter.emit('$system', { type: '$socket:error', socket, event: error });
      });

      sock.on('end', (reason) => {
        emitter.emit('$system', { type: '$socket:disconnect', socket, event: reason });
      });
    });
  }
}
