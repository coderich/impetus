const { io } = require('socket.io-client');
const { terminal } = require('terminal-kit');

let input;
let buffer;
let aborted = false;
let status = '';
terminal.grabInput();
terminal.hideCursor(false);
terminal.wrapColumn({ width: 80 });
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

const abort = () => {
  input.abort();
  aborted = true;
};

const resume = () => {
  terminal.wrap(buffer);
  inputField();
  aborted = false;
  buffer = '';
};

socket.on('connect', () => {
  terminal.clear();
});

socket.on('status', (event) => {
  status = `[HP=${event.hp}]`;
});

socket.on('dialog', (event, cb) => {
  abort();
  terminal('\n').wrap(event);
  if (cb) {
    terminal.inputField((err, value) => {
      cb(value);
      resume();
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
  const msg = `\n${event}`;
  if (aborted) buffer += msg;
  else terminal.wrap(`${msg}\n^:${status}: `);
  input.rebase();
});

socket.on('clear', () => {
  terminal.clear();
});

socket.on('menu', ({ data, items = [] }, cb) => {
  abort();
  items.unshift('{exit}');
  if (data) terminal('\n').wrap(data);
  terminal.singleRowMenu(items, { fillIn: true }, (error, response) => {
    resume();
    cb({ index: response.selectedIndex, text: response.selectedText });
  });
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
