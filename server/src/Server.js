import FS from 'fs';
import HTTP from 'http';
import SocketServer from 'socket.io';
import TelnetLib from 'telnetlib';
import { IOSocket, TelnetSocket } from './Socket';
import { emitter } from './ChainEmitter';

export class IOServer {
  constructor() {
    const server = SocketServer();

    server.on('connection', (sock) => {
      const socket = new IOSocket(sock);

      emitter.emit('$socket:connection', { socket });

      sock.on('disconnecting', (reason) => {
        emitter.emit('$socket:disconnecting', { socket, event: reason });
      });

      sock.on('disconnect', (reason) => {
        emitter.emit('$socket:disconnect', { socket, event: reason });
        sock.removeAllListeners();
      });

      sock.on('error', (error) => {
        emitter.emit('$socket:error', { socket, event: error });
      });

      sock.onAny((type, event) => {
        emitter.emit(`$socket:${type}`, { socket, event });
      });
    });

    return server;
  }
}

export class TelnetServer {
  constructor() {
    const { GMCP, ECHO } = TelnetLib.options;

    return TelnetLib.createServer({ localOptions: [GMCP, ECHO] }, (sock) => {
      const gmcp = sock.getOption(GMCP);
      const socket = new TelnetSocket(sock, gmcp);
      // const credentials = [];

      sock.on('negotiated', () => {
        emitter.emit('$socket:connection', { socket });
      });

      sock.on('data', (buffer) => {
        const data = buffer.toString('utf-8');
        emitter.emit('$socket:data', { socket, event: data });

        // if (sock.isLoggedIn || credentials.length === 2) {
        //   emitter.emit('$socket:data', { socket, event: data });
        // } else {
        //   credentials.unshift(data);
        // }
      });

      gmcp.on('gmcp', (ns, event, data) => {
        if (ns === 'impetus') emitter.emit(`$socket:${event}`, { socket, event: data });
      });

      sock.on('error', (error) => {
        emitter.emit('$socket:error', { socket, event: error });
      });

      sock.on('end', (reason) => {
        emitter.emit('$socket:disconnect', { socket, event: reason });
      });
    });
  }
}

export class WebServer {
  constructor() {
    const map = FS.readFileSync(`${__dirname}/../map.xml`);

    return HTTP.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/xml');
      // res.setHeader('Content-Disposition', 'attachment;filename=map.dat');
      res.writeHead(200);
      res.end(map);
    });
  }
}
