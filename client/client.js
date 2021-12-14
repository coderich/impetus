const { io } = require('socket.io-client');
const { terminal } = require('terminal-kit');

let input;
terminal.grabInput();
const socket = io('http://localhost:3003');

const inputField = () => {
  input = terminal.inputField((err, value) => {
    socket.emit('data', value);
    terminal.scrollUp(1).column(0);
    inputField();
  });
};

socket.on('query', (event, cb) => {
  input.abort();
  input = terminal(event).inputField((err, value) => {
    cb(value);
    terminal.scrollUp(1).column(0);
    inputField();
  });
});

socket.on('data', (event) => {
  terminal(`\n${event}`);
  // terminal.eraseLine(); // Erase current writing
  // terminal.insertLine(1).nextLine(1);
  // terminal(event);
  // terminal(buffer);
});

inputField();

terminal.on('key', (name, matches, data) => {
  switch (name) {
    case 'CTRL_C': {
      terminal.grabInput(false);
      process.exit(0);
      break;
    }
    default: break;
  }
});
