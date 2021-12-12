import FS from 'fs';
import YAML from 'js-yaml';
import JSONLogic from 'json-logic-js';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';
import { resolveDataObject, toDataAccessObject, daoMethods, promiseChain } from './src/Util';

// Load game data
const game = YAML.load(FS.readFileSync(`${__dirname}/game.yaml`, 'utf8'));

// Create instances
const redis = new Redis();

// Extend JSON Logic with custom operations
JSONLogic.add_operation('$db', toDataAccessObject(redis));
JSONLogic.add_operation('$data', toDataAccessObject(new Data(game.data)));
JSONLogic.add_operation('$timeout', ms => new Promise(res => setTimeout(res, ms)));
JSONLogic.add_operation('$object', (...args) => resolveDataObject(args.reduce((prev, key, i) => (i % 2 === 0 ? Object.assign(prev, { [key]: args[i + 1] }) : prev), {})));
JSONLogic.add_operation('$log', async (...args) => console.log(...await resolveDataObject(args))); // eslint-disable-line no-console
JSONLogic.add_operation('$emit', function emit(type, event) { return EventEmitter.emit('$system', { type, event, socket: this.socket }); });
JSONLogic.add_operation('$socket', {
  emit: async function emit(...args) { return this.socket.emit(...await resolveDataObject(args)); },
  ...daoMethods.reduce((prev, method) => Object.assign(prev, {
    [method]: function dao(...args) { return this.socket.$data[method](...args); },
  }), {}),
});

// The entire engine is event driven
EventEmitter.on('$system', async (...args) => {
  const { events = {} } = game;
  const { type, socket, event } = await resolveDataObject(...args);
  const rules = events[type] || [];
  return promiseChain(rules.map(rule => () => {
    const method = Array.isArray(rule) ? 'all' : 'resolve';
    return Promise[method](JSONLogic.apply(rule, { socket, event, data: game.data }));
  }));
});

// Start server
(async () => {
  const { server = {} } = game;
  new Server().listen(server.port || 3003);
  await redis.connect();
  EventEmitter.emit('$system', { type: '$server.ready' });
})();
