import SocketServer from 'socket.io';
import EventEmitter from './EventEmitter';
import Data from './Data';
import { toDataAccessObject } from './Util';

export default class Server {
  constructor(config) {
    const server = SocketServer();

    server.on('connection', (socket) => {
      socket.$data = toDataAccessObject(new Data(socket.data));
      EventEmitter.emit('$system', { type: '$server.connection', socket });

      socket.on('disconnecting', (reason) => {
        EventEmitter.emit('$system', { type: '$server.disconnecting', socket, event: reason });
      });

      socket.on('disconnect', (reason) => {
        EventEmitter.emit('$system', { type: '$server.disconnect', socket, event: reason });
        socket.removeAllListeners();
      });

      socket.on('error', (error) => {
        EventEmitter.emit('$system', { type: '$server.error', socket, event: error });
      });

      socket.on('message', (input) => {
        EventEmitter.emit('$system', { type: '$server.message', socket, event: input });
      });
    });

    return server;
  }
}
