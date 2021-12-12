// import JSONLogic from 'json-logic-js';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';
import { promiseChain } from './src/Util';
import config from './config';

// Load game data
const $db = new Redis();
const $data = new Data(config.data);

// The entire engine is event driven
EventEmitter.on('$system', ({ type, socket, event }) => {
  const { events = {} } = config;
  const listeners = events[type] || [];
  return promiseChain(listeners.map(listener => () => {
    const method = Array.isArray(listener) ? 'all' : 'resolve';
    const $emit = (t, e) => EventEmitter.emit('$system', { type: t, socket, event: e });
    return Promise[method](listener({ $db, $data, $emit, socket, event }));
  }));
});

// Start server
(async () => {
  const { server = {} } = config;
  new Server().listen(server.port || 3003);
  await $db.connect();
  EventEmitter.emit('$system', { type: '$server:ready' });
})();
