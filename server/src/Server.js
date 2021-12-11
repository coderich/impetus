import SocketServer from 'socket.io';
import EventEmitter from './EventEmitter';

export default class Server {
  constructor(config) {
    const server = SocketServer();

    server.on('connection', (socket) => {
      EventEmitter.emit('System', { type: 'Server.connection', event: socket });

      socket.on('disconnecting', (reason) => {
        EventEmitter.emit('System', { type: 'Server.disconnecting', event: reason });
      });

      socket.on('disconnect', (reason) => {
        EventEmitter.emit('System', { type: 'Server.disconnect', event: reason });
        socket.removeAllListeners();
      });

      socket.on('error', (error) => {
        EventEmitter.emit('System', { type: 'Server.error', event: error });
      });

      socket.on('message', (input) => {
        EventEmitter.emit('System', { type: 'Server.message', event: input });
      });
    });

    return server;
  }
}
