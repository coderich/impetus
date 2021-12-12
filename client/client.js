const { io } = require("socket.io-client");
const { terminal } = require('terminal-kit');

let buffer = '';
const socket = io('http://localhost:3003');

const terminate = () => {
  terminal.grabInput(false);
  process.exit(0);
}

socket.on('data', (event) => {
  terminal.eraseLine(); // Erase current writing
  terminal.insertLine(1).nextLine(1);
  terminal(`${event}\n`);
  terminal.cyan(buffer);
});

terminal.grabInput();

terminal.on('key', (name, matches, data) => {
  const { code } = data;

  switch (name) {
    case 'CTRL_C': {
      terminate();
      break;
    }
    case 'BACKSPACE': {
      terminal.backDelete();
      buffer.slice(0, -1);
      break;
    }
    case 'ENTER': {
      socket.emit('data', buffer);
      terminal.scrollUp(1).insertLine(1).nextLine(1);
      buffer = '';
      break;
    }
    default: {
      if (code > 31 && code < 127) {
        buffer += name;
        terminal.cyan(name);
      }
    }
  }
});
