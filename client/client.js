const { io } = require('socket.io-client');
const { terminal } = require('terminal-kit');

let input;
terminal.grabInput();
terminal.hideCursor(false);
terminal.wrapColumn({ x: 5, width: 80 });
const socket = io('http://localhost:3003');

// const promiseChain = (promises) => {
//   return promises.reduce((chain, promise) => {
//     return chain.then(chainResults => promise([...chainResults]).then(promiseResult => [...chainResults, promiseResult]));
//   }, Promise.resolve([]));
// };

// const timeout = ms => new Promise(res => setTimeout(res, ms));

const inputField = () => {
  input = terminal.inputField((err, value) => {
    input.hide();
    socket.emit('data', value);
    inputField();
  });
};

socket.on('connect', () => {
  terminal.clear();
});

socket.on('dialog', (event, cb) => {
  input.abort();
  terminal.wrap('\n');
  terminal.wrap(event);
  if (cb) {
    terminal.inputField((err, value) => {
      cb(value);
      inputField();
    });
  }

  // promiseChain(event.split(' ').map(token => () => {
  //   let [color, word] = token.split(':');
  //   if (!word) { word = color; color = 'green'; }
  //   return Promise.all([...word].map((char) => {
  //     terminal.wrap[color](char);
  //     return timeout(25);
  //   })).then(() => {
  //     terminal.wrap(' ');
  //   });
  // })).then(() => {
  //   terminal.move(-1).inputField((err, value) => {
  //     cb(value);
  //     inputField();
  //   });
  // });
});

socket.on('data', (event) => {
  terminal.wrap('\n');
  terminal.wrap(`${event}\n^:[HP=30]: `);
  input.rebase();
});

socket.on('clear', () => {
  terminal.clear();
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
