import Dao from './src/Dao';
import Data from './src/Data';
import Redis from './src/Redis';
import { IOServer, TelnetServer } from './src/Server';
import { emitter } from './src/ChainEmitter';

export default async (gameConfig) => {
  // Normalize Game Config
  Object.entries(gameConfig).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value || {} }), gameConfig);

  // Create instances
  const sockets = {};
  const $emitter = emitter;
  const redis = new Redis(gameConfig.redis);
  const $dao = new Dao($emitter, redis, new Data({}), new Data(gameConfig.data), gameConfig.models, sockets);
  const $io = new IOServer(gameConfig.server);
  const $telnet = new TelnetServer();

  emitter.on('$socket:connection', async ({ socket }) => {
    // Player setup
    const id = await $dao.db.inc('autoIncrement');
    const $id = `Player.${id}`;
    sockets[$id] = socket;
    const room = await $dao.db.get('Room.car');
    const $this = await $dao.db.set($id, { id, room: 'Room.car', items: [], stats: { hp: 100, mhp: 100, ma: 10, mma: 10, ac: 10, dc: 2, str: 8, dex: 6, int: 4 } });
    await $this.toRoom({ room });
    $this.status();
    $this.scan();
    socket.player = $this;

    Object.entries(gameConfig.translators).forEach(([on, directive]) => {
      emitter.on(`$socket:${on}`, ({ event, socket: sock }) => {
        if (sock === socket) {
          Object.entries(directive).some(([path, fn]) => {
            const value = fn(event.trim());

            if (value != null) {
              const [, method] = path.split('.');
              $this[method]({ $this, $dao, $emitter, event: value });
              return true;
            }

            return false;
          });
        }
      });
    });
  });

  // emitter.on('$socket.data', ({ socket, event }) => {
  //   const listener = gameConfig.listeners.data;
  //   if (listener) listener({ $dao, $emitter, socket, event });
  // });

  // Start server(s)
  await redis.connect();
  $io.listen(gameConfig.server.port || 3003);
  $telnet.listen(23);
  const listener = gameConfig.listeners.$ready;
  listener({ $dao });
  // emitter.emit('$system', { type: '$ready' });
};
