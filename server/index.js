import Dao from './src/Dao';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import EventEmitter from './src/EventEmitter';

export default async (config) => {
  // Normalize config
  Object.entries(config).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value || {} }), config);

  // Create instances
  const data = new Data(config.data);
  const redis = new Redis(config.redis);
  const $dao = new Dao(redis, data, config.models);
  // const $db = new Dao(redis, config.models);
  // const $data = new Dao(data, config.models);
  const $server = new Server(config.server);

  // The entire engine is event driven
  EventEmitter.on('$system', ({ type, socket, event }) => {
    const listener = config.listeners[type];

    if (listener) {
      const $emit = (t, e) => EventEmitter.emit('$system', { type: t, socket, event: e });
      listener({ $dao, $emit, socket, event, data: config.data });
    }
  });

  EventEmitter.on('$system', ({ type, socket }) => {
    if (type === '$socket:connection') {
      Object.entries(config.translators).forEach(([on, directive]) => {
        socket.on(on, (event) => {
          Object.entries(directive).some(([path, fn]) => {
            const value = fn(event.trim());

            if (value != null) {
              const [root, method] = path.split('.');
              const $this = socket.data[root];
              $this[method]({ $this, $dao, socket, event: value });
              return true;
            }

            return false;
          });
        });
      });
    }
  });

  // Start server
  await redis.connect();
  $server.listen(config.server.port || 3003);
  EventEmitter.emit('$system', { type: '$ready' });
};
