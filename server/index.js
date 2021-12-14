import EventEmitter from './src/EventEmitter';
import { $db, $data, $server, redis, config } from './src/Service';

// The entire engine is event driven
EventEmitter.on('$system', ({ type, socket, event }) => {
  const listener = config.listeners[type];

  if (listener) {
    const $emit = (t, e) => EventEmitter.emit('$system', { type: t, socket, event: e });
    listener({ $db, $data, $emit, socket, event, data: config.data });
  }
});

EventEmitter.on('$system', ({ type, socket }) => {
  if (type === '$socket:connection') {
    Object.entries(config.translators).forEach(([on, directive]) => {
      socket.on(on, (event) => {
        const [path] = Object.entries(directive).find(([k, fn]) => fn(event));

        if (path) {
          const [root, method] = path.split('.');
          const $model = socket.data[root];
          $model[method]({ $model, $db, $data, socket, event });
        }
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
