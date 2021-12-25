import TelnetLib from 'telnetlib';

export class IOSocket {
  constructor(socket) {
    return socket;
  }
}

export class TelnetSocket {
  constructor(socket) {
    const { GMCP } = TelnetLib.options;
    this.gmcp = socket.getOption(GMCP);
    this.socket = socket;
    this.broadcast = {
      to: room => ({
        emit: (...args) => this.emit(...args),
      }),
    };
  }

  on(...args) {
    return this.socket.on(...args);
  }

  emit(event, data, ...rest) {
    return this.gmcp.send('impetus', event, data);
  }

  join(...args) {

  }

  leave(...args) {

  }
}
