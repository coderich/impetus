export default {
  $ready: async ({ $dao, data }) => {
    // const installed = await $db.get('installed');
    // if (!installed) $db.set('installed', { ...data, players: {}, autoIncrement: 0 });
    await $dao.db.set('Player', {});
    await $dao.db.set('autoIncrement', 0);
    return Promise.all(Object.entries(data).map(([model, definition]) => $dao.db.set(model, definition))).then(() => {
      return Promise.all(Object.keys(data.Room).map(id => $dao.db.ref(`Room.${id}`).init()));
    });
  },

  '$socket:connection': async ({ $dao, socket }) => {
    const { handshake: { query } } = socket;
    const { uid } = query;

    if (!uid) {
      socket.emit('query', 'Welcome traveler, what is your name? ', async (name) => {
        const id = await $dao.db.inc('autoIncrement');
        const room = await $dao.db.get('Room.a');
        socket.data.Player = await $dao.db.set(`Player.${id}`, { id, name, room: 'Room.a' });
        await socket.data.Player.toRoom({ $dao, socket, room });
        socket.data.Player.scan({ $this: socket.data.Player, socket });
      });
    }
  },
};
