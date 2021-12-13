import DAO from './src/DAO';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';
import config from './config';

// Ensure config
['data', 'models', 'server', 'eventBus', 'eventListeners', 'redis'].forEach(key => (config[key] = config[key] || {}));

// Instantiate classes
const data = new Data(config.data);
const redis = new Redis(config.redis);
const $db = new DAO(redis, config.models);
const $data = new DAO(data, config.models);
const $server = new Server(config.server);

// The entire engine is event driven
EventEmitter.on('$system', ({ type, socket, event }) => {
  const listener = config.eventListeners[type];

  if (listener) {
    const $emit = (t, e) => EventEmitter.emit('$system', { type: t, socket, event: e });
    listener({ $db, $data, $emit, socket, event, data: config.data });
  }
});

EventEmitter.on('$system', ({ type: systemType, socket }) => {
  if (systemType === '$socket:connection') {
    Object.entries(config.eventBus).forEach(([bus, events]) => {
      socket.on(bus, (input) => {
        const [type] = Object.entries(events).find(([k, fn]) => fn(input));
        if (type) EventEmitter.emit('$system', { type, event: input, socket });
      });
    });
  }
});

// Start server
(async () => {
  await redis.connect();
  $server.listen(config.server.port || 3003);
  EventEmitter.emit('$system', { type: '$ready' });
})();
