export default {
  $ready: async ({ $dao, data }) => {
    // const installed = await $db.get('installed');
    // if (!installed) $db.set('installed', { ...data, players: {}, autoIncrement: 0 });
    await $dao.db.set('Player', {});
    await $dao.db.set('autoIncrement', 0);
    return Object.entries(data).map(([model, definition]) => $dao.db.set(model, definition));
  },

  '$socket:connection': async ({ $dao, socket }) => {
    const { handshake: { query } } = socket;
    const { uid } = query;

    if (!uid) {
      socket.emit('query', 'Welcome to Impetus!\nWhat shall I call you? ', async (name) => {
        const id = await $dao.db.inc('autoIncrement');
        socket.data.Player = await $dao.db.set(`Player.${id}`, { id, name, room: 'Room.a' });
        await socket.data.Player.toRoom({ $dao, socket, room: 'Room.a' });
        socket.data.Player.scan({ $this: socket.data.Player, socket });
      });
    }
  },
};
