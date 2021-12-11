import FS from 'fs';
import YAML from 'js-yaml';
import JSONLogic from 'json-logic-js';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';

// Load game data
const game = YAML.load(FS.readFileSync(`${__dirname}/game.yaml`, 'utf8'));

// Create instances
const redis = new Redis();
const data = new Data(game.data);

// Extend JSON Logic with custom operations
JSONLogic.add_operation('$db', Redis.toObject(redis));
JSONLogic.add_operation('$data', Data.toObject(data));
JSONLogic.add_operation('$emit', (type, event) => EventEmitter.emit('$system', { type, event }));

// The entire engine is event driven
EventEmitter.on('$system', ({ type, event }) => {
  console.log(type);
  const { events = {} } = game;
  JSONLogic.apply(events[type], { event });
});

// Start server
(async () => {
  const { server = {} } = game;
  new Server().listen(server.port || 3003);
  await redis.connect();
  EventEmitter.emit('$system', { type: '$server.ready' });
})();
