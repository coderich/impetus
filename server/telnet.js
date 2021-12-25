import Net from 'net';
import { TelnetSocket, TelnetSpec } from 'telnet-socket';

Net.createServer((socket) => {
  const telnetSocket = new TelnetSocket(socket);

  // telnetSocket.do.naws();

  // This tells the client that WE WILL DO THE ECHO'ing!
  telnetSocket.will.echo();

  // telnetSocket.on('SB', (command) => {
  //   if (TelnetSpec.Options.NAWS === command.option) {
  //     const { width, height } = command.optionData;
  //     console.log(width, height);
  //   }
  // });

  socket.on('end', () => {
  });

  socket.on('data', (e) => {
    // socket.write('hello \u001b[38;5;22mworld\n');
    telnetSocket.write('hello world\n');
    // telnetSocket.command('hello', {});
  });
}).listen(3000);
