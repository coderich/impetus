import JSONLogic from 'json-logic-js';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';
import { resolveDataObject, toDataAccessObject, daoMethods, promiseChain } from './src/Util';
import config from './config';

// Load game data
const ram = {};
const redis = new Redis();

// Extend JSON Logic with custom operations
JSONLogic.add_operation('$db', toDataAccessObject(redis));
JSONLogic.add_operation('$ram', toDataAccessObject(new Data(ram)));
JSONLogic.add_operation('$data', toDataAccessObject(new Data(config.data)));
JSONLogic.add_operation('$timeout', ms => new Promise(res => setTimeout(res, ms)));
JSONLogic.add_operation('$object', (...args) => resolveDataObject(args.reduce((prev, key, i) => (i % 2 === 0 ? Object.assign(prev, { [key]: args[i + 1] }) : prev), {})));
JSONLogic.add_operation('$log', async (...args) => console.log(...await resolveDataObject(args))); // eslint-disable-line no-console
JSONLogic.add_operation('$emit', function emit(type, event) { return EventEmitter.emit('$system', { type, event, socket: this.socket }); });
JSONLogic.add_operation('$socket', {
  emit: async function emit(...args) { return this.socket.emit(...await resolveDataObject(args)); },
  join: async function join(...args) { return this.socket.join(await resolveDataObject(args)); },
  leave: async function leave(...args) { return this.socket.leave(...await resolveDataObject(args)); },
  to: async function to(...args) { return this.socket.to(await resolveDataObject(args[0])).emit(...await resolveDataObject(args.slice(1))); },
  except: async function except(...args) { return this.socket.except(await resolveDataObject(args[0])).emit(...await resolveDataObject(args.slice(1))); },
  disconnect: async function disconnect(...args) { return this.socket.disconnect(...await resolveDataObject(args)); },
  broadcast: async function broadcast(...args) { return this.socket.broadcast.emit(...await resolveDataObject(args)); },
  ...daoMethods.reduce((prev, method) => Object.assign(prev, {
    [method]: function dao(...args) { return this.socket.$data[method](...args); },
  }), {}),
});

// User defined macros
const { macros = {} } = config;
Object.entries(macros).forEach(([key, fn]) => JSONLogic.add_operation(key, async function macroWrapper(...args) { return fn.call(this, ...await resolveDataObject(args)); }));

// The entire engine is event driven
EventEmitter.on('$system', async (...args) => {
  const { events = {} } = config;
  const { type, socket, event } = await resolveDataObject(...args);
  const rules = events[type] || [];
  return promiseChain(rules.map(rule => () => {
    const method = Array.isArray(rule) ? 'all' : 'resolve';
    return Promise[method](JSONLogic.apply(rule, { socket, event, data: config.data, ram }));
  }));
});

// Start server
(async () => {
  const { server = {} } = config;
  new Server().listen(server.port || 3003);
  await redis.connect();
  EventEmitter.emit('$system', { type: '$server:ready' });
})();
