import Dao from './src/Dao';
import Data from './src/Data';
import Redis from './src/Redis';
import Server from './src/Server';
import { emitter } from './src/ChainEmitter';

export default async (gameConfig) => {
  // Normalize Game Config
  Object.entries(gameConfig).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value || {} }), gameConfig);

  // Create instances
  const sockets = {};
  const $emitter = emitter;
  const redis = new Redis(gameConfig.redis);
  const $dao = new Dao($emitter, redis, new Data({}), new Data(gameConfig.data), gameConfig.models, sockets);
  const $server = new Server(gameConfig.server);

  emitter.on('$system', async ({ type, socket }) => {
    if (type === '$socket:connection') {
      // Player setup
      const id = await $dao.db.inc('autoIncrement');
      const $id = `Player.${id}`;
      sockets[$id] = socket;
      const room = await $dao.db.get('Room.car');
      const $this = await $dao.db.set($id, { id, room: 'Room.car', items: [], stats: { hp: 30, ma: 10, ac: 10, dc: 2, str: 8, dex: 6, int: 4 } });
      await $this.toRoom({ room });
      $this.status();
      $this.scan();

      Object.entries(gameConfig.translators).forEach(([on, directive]) => {
        socket.on(on, (event) => {
          Object.entries(directive).some(([path, fn]) => {
            const value = fn(event.trim());

            if (value != null) {
              const [, method] = path.split('.');
              $this[method]({ $this, $dao, $emitter, event: value });
              return true;
            }

            return false;
          });
        });
      });
    }
  });

  emitter.on('$system', ({ type, socket, event }) => {
    const listener = gameConfig.listeners[type];
    if (listener) listener({ $dao, $emitter, socket, event });
  });

  // Start server
  await redis.connect();
  $server.listen(gameConfig.server.port || 3003);
  emitter.emit('$system', { type: '$ready' });
};
