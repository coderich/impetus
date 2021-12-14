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
        socket.data.Player = await $db.set(`Player.${id}`, { id, name, room: 'Room.a' });
        await socket.data.Player.toRoom({ $db, socket, room: 'Room.a' });
        socket.data.Player.scan({ $this: socket.data.Player, socket });
      });
    }
  },
};
