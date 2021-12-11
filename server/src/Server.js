import SocketServer from 'socket.io';
import EventEmitter from './EventEmitter';

export default class Server {
  constructor(config) {
    const server = SocketServer();

    server.on('connection', (socket) => {
      EventEmitter.emit('$system', { type: '$server.connection', event: socket });

      socket.on('disconnecting', (reason) => {
        EventEmitter.emit('$system', { type: '$server.disconnecting', event: reason });
      });

      socket.on('disconnect', (reason) => {
        EventEmitter.emit('$system', { type: '$server.disconnect', event: reason });
        socket.removeAllListeners();
      });

      socket.on('error', (error) => {
        EventEmitter.emit('$system', { type: '$server.error', event: error });
      });

      socket.on('message', (input) => {
        EventEmitter.emit('$system', { type: '$server.message', event: input });
      });
    });

    return server;
  }
}
