const { io } = require('socket.io-client');
const { terminal } = require('terminal-kit');

let input;
terminal.grabInput();
terminal.hideCursor(false);
const socket = io('http://localhost:3003');

const inputField = () => {
  input = terminal.inputField((err, value) => {
    input.hide();
    socket.emit('data', value);
    inputField();
  });
};

socket.on('connect', () => {
  terminal.bell();
  terminal.clear();
});

socket.on('query', (event, cb) => {
  input.abort();
  terminal.slowTyping(event, { delay: 10 }, () => {
    terminal.inputField((err, value) => {
      cb(value);
      inputField();
    });
  });
});

socket.on('data', (event) => {
  terminal.nextLine();
  terminal(`${event}\n^:[HP=30]: `);
  input.rebase();
});

inputField();

terminal.on('key', (name, matches, data) => {
  switch (name) {
    case 'CTRL_C': {
      terminal.grabInput(false);
      process.exit(0);
      break;
    }
    default: {
      break;
    }
  }
});
