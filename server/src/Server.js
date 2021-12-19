import SocketServer from 'socket.io';
import Data from './Data';
import { emitter } from './ChainEmitter';
import { toDataAccessObject } from './Util';

export default class Server {
  constructor(config) {
    const server = SocketServer();

    server.on('connection', (socket) => {
      socket.$data = toDataAccessObject(new Data(socket.data));
      emitter.emit('$system', { type: '$socket:connection', socket });

      socket.on('disconnecting', (reason) => {
        emitter.emit('$system', { type: '$socket:disconnecting', socket, event: reason });
      });

      socket.on('disconnect', (reason) => {
        emitter.emit('$system', { type: '$socket:disconnect', socket, event: reason });
        socket.removeAllListeners();
      });

      socket.on('error', (error) => {
        emitter.emit('$system', { type: '$socket:error', socket, event: error });
      });

      socket.onAny((type, event) => {
        emitter.emit('$system', { type: `$socket:${type}`, socket, event });
      });
    });

    return server;
  }
}
