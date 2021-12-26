import { terminal, telnet } from './Swig';

export class IOSocket {
  constructor(socket) {
    this.socket = socket;
    this.on = socket.on.bind(socket);
    this.broadcast = socket.broadcast;
    this.join = socket.join.bind(socket);
    this.leave = socket.leave.bind(socket);
    // this.emit = socket.emit.bind(socket);
  }

  emit(event, data, ...rest) {
    data = typeof data === 'string' ? terminal.render(data) : data;
    return this.socket.emit(event, data, ...rest);
  }
}

export class TelnetSocket {
  constructor(socket, gmcp) {
    this.gmcp = gmcp;
    this.socket = socket;
    this.broadcast = {
      to: room => ({
        emit: (...args) => null,
      }),
    };
  }

  on(...args) {
    return this.socket.on(...args);
  }

  emit(event, data, ...rest) {
    data = typeof data === 'string' ? telnet.render(data) : data;
    return this.gmcp.send('impetus', event, data);
  }

  join(...args) {

  }

  leave(...args) {

  }

  login() {
    return this.gmcp.send('Client', 'login', () => {
      console.log('got something from client');
    });
  }
}
