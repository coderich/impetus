export default {
  $ready: async ({ $db, data }) => {
    // const installed = await $db.get('installed');
    // if (!installed) $db.set('installed', { ...data, players: {}, autoIncrement: 0 });
    await $db.set('Player', {});
    await $db.set('autoIncrement', 0);
    return Object.entries(data).map(([model, definition]) => $db.set(model, definition));
  },

  '$socket:connection': async ({ $db, $emit, socket }) => {
    const { handshake: { query } } = socket;
    const { uid } = query;

    if (!uid) {
      socket.emit('query', 'Welcome to Impetus!\nWhat shall I call you? ', async (name) => {
        const id = await $db.inc('autoIncrement');
        socket.data.player = await $db.set(`Player.${id}`, { id, name, room: 'Room.a' });
        $emit('player:scan');
      });
    } else {
      socket.data.player = uid;
      $emit('player:scan');
    }
  },

  'player:scan': async ({ $db, socket }) => {
    const { player } = socket.data;
    const room = await player.ref('room');
    const description = await room.describe();
    socket.emit('data', description);
  },

  'player:move': async ({ $db, $emit, socket, event: dir }) => {
    const { player } = socket.data;
    const room = await player.hydrate('room');

    if (room.exits[dir]) {
      await player.set('room', room.exits[dir]);
      $emit('player:scan');
    } else {
      socket.emit('data', '^rno exit in that direction!\n');
    }
  },

  'player:chat': ({ socket, event }) => {
    return socket.broadcast.emit('data', `${event}\n`);
  },
};
