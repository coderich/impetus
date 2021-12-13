export default {
  $ready: [
    async ({ $db, data }) => {
      const installed = await $db.get('impetus.installed');
      if (!installed) $db.set('impetus', { rooms: data.rooms, players: {}, autoIncrement: 0 });
    },
  ],

  '$socket:connection': [
    async ({ $db, $emit, socket }) => {
      const { handshake: { query } } = socket;
      const { uid } = query;

      if (!uid) {
        socket.emit('query', 'Welcome to Impetus!\nWhat shall I call you? ', async (name) => {
          const id = await $db.inc('impetus.autoIncrement');
          socket.data.id = id;
          await $db.set(`impetus.players.${id}`, { id, name, room: 'a' });
          $emit('player:scan');
        });
      } else {
        socket.data.player = uid;
        $emit('player:scan');
      }
    },
  ],

  '$socket:data': [
    ({ socket, event }) => {
      if (event) socket.broadcast.emit('data', event);
    },
  ],

  'player:scan': [
    async ({ $db, socket }) => {
      const { id } = socket.data;
      const player = await $db.get(`impetus.players.${id}`);
      const room = await $db.get(`impetus.rooms.${player.room}`);
      socket.emit('data', `^c${room.name}\n\t^:${room.description}\n^gExits: ${Object.keys(room.exits).join(', ')}: `);
    },
  ],

  'player:move': [
    async ({ $db, $emit, socket, event: dir }) => {
      const { id } = socket.data;
      const player = await $db.get(`impetus.players.${id}`);
      const room = await $db.get(`impetus.rooms.${player.room}`);

      if (room.exits[dir]) {
        await $db.set(`impetus.players.${player.id}.room`, room.exits[dir]);
        $emit('player:scan');
      } else {
        socket.emit('data', '^rno exit in that direction!\n');
      }
    },
  ],
};
