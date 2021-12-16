export default {
  $ready: async ({ $dao }) => {
    await $dao.db.set('autoIncrement', 0);
    const roomConfig = await $dao.config.get('Room');
    return Promise.all(Object.entries(roomConfig).map(([id, definition]) => $dao.db.set(`Room.${id}`, definition))).then((rooms) => {
      return Promise.all(rooms.map(room => room.init()));
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
