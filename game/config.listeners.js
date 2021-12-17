export default {
  $ready: async ({ $dao }) => {
    await $dao.db.set('autoIncrement', 0);
    const config = await $dao.config.get('');
    const data = { Room: config.Room, NPC: config.NPC };
    return Promise.all(Object.entries(data).map(([root, value]) => {
      return Promise.all(Object.entries(value).map(([id, definition]) => {
        const key = `${root}.${id}`;
        return $dao.db.set(key, definition);
      }));
    })).then((models) => {
      return Promise.all(models.flat().map(model => model.init()));
    });
  },

  '$socket:connection': async ({ $dao, socket }) => {
    const { handshake: { query } } = socket;
    const { uid } = query;

    if (!uid) {
      socket.emit('query', 'Welcome traveler, what is your name? ', async (name) => {
        const id = await $dao.db.inc('autoIncrement');
        const room = await $dao.db.get('Room.car');
        socket.data.Player = await $dao.db.set(`Player.${id}`, { id, name, room: 'Room.car' });
        await socket.data.Player.toRoom({ $dao, socket, room });
        socket.data.Player.scan({ $this: socket.data.Player, socket });
      });
    }
  },
};
