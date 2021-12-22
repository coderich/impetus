import Dao from './src/Dao';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import { emitter } from './src/ChainEmitter';

export default async (gameConfig) => {
  // Normalize Game Config
  Object.entries(gameConfig).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value || {} }), gameConfig);

  // Create instances
  const $emitter = emitter;
  const redis = new Redis(gameConfig.redis);
  const $dao = new Dao($emitter, redis, new Data({}), new Data(gameConfig.data), gameConfig.models);
  const $server = new Server(gameConfig.server);

  // The entire engine is event driven
  emitter.on('$system', ({ type, socket, event }) => {
    const listener = gameConfig.listeners[type];
    if (listener) listener({ $dao, $emitter, socket, event });
  });

  emitter.on('$system', ({ type, socket }) => {
    if (type === '$socket:connection') {
      Object.entries(gameConfig.translators).forEach(([on, directive]) => {
        socket.on(on, (event) => {
          Object.entries(directive).some(([path, fn]) => {
            const value = fn(event.trim());

            if (value != null) {
              const [root, method] = path.split('.');
              const $this = socket.data[root];
              $this[method]({ $this, $dao, $emitter, event: value });
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
  $server.listen(gameConfig.server.port || 3003);
  emitter.emit('$system', { type: '$ready' });
};
