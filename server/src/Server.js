import SocketServer from 'socket.io';
import EventEmitter from './EventEmitter';
import Data from './Data';
import { toDataAccessObject } from './Util';

export default class Server {
  constructor(config) {
    const server = SocketServer();

    server.on('connection', (socket) => {
      socket.$data = toDataAccessObject(new Data(socket.data));
      EventEmitter.emit('$system', { type: '$socket:connection', socket });

      socket.on('disconnecting', (reason) => {
        EventEmitter.emit('$system', { type: '$socket:disconnecting', socket, event: reason });
      });

      socket.on('disconnect', (reason) => {
        EventEmitter.emit('$system', { type: '$socket:disconnect', socket, event: reason });
        socket.removeAllListeners();
      });

      socket.on('error', (error) => {
        EventEmitter.emit('$system', { type: '$socket:error', socket, event: error });
      });

      socket.onAny((type, event) => {
        EventEmitter.emit('$system', { type: `$socket:${type}`, socket, event });
      });
    });

    return server;
  }
}
