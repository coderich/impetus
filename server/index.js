import FS from 'fs';
import YAML from 'js-yaml';
import JSONLogic from 'json-logic-js';
import Data from './src/Data';
import Redis, { connect } from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';

// Load game data
const game = YAML.load(FS.readFileSync(`${__dirname}/game.yaml`, 'utf8'));

JSONLogic.add_operation('$db', Redis);
JSONLogic.add_operation('$data', Data.create(game.data));
JSONLogic.add_operation('$emit', (type, event) => EventEmitter.emit('System', { type, event }));

EventEmitter.on('System', ({ type, event }) => {
  console.log(type);
  const { events = {} } = game;
  JSONLogic.apply(events[type], { event });
});

(async () => {
  const { server = {} } = game;
  new Server().listen(server.port || 3003);
  await connect();
  EventEmitter.emit('System', { type: 'Server.ready' });
})();
