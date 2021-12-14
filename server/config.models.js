export default {
  Player: {
    toRoom: async ({ $model, $db, socket, room }) => {
      socket.join(room);
      await $db.push(`${room}.units`, $model.id);
      await $model.set('room', room);
    },

    fromRoom: async ({ $model, $db, socket, room }) => {
      socket.leave(room);
      await $db.pull(`${room}.units`, $model.id);
      await $model.del('room');
    },

    scan: async ({ $model, socket }) => {
      const room = await $model.hydrate('room');
      const units = await room.hydrate('units').then(arr => arr.filter(el => el.id !== $model.id));
      const description = `^c${room.name}\n\t^:${room.description}\n${units.length ? `^mAlso here: ${units.map(u => u.name).join(', ')}\n` : ''}^gExits: ${Object.keys(room.exits).join(', ')}: `;
      socket.emit('data', description);
    },

    move: async ({ $model, $db, socket, event: dir }) => {
      const from = await $model.hydrate('room');
      const to = from.exits[dir];

      if (to) {
        const player = await $model.get();

        // Leave room
        socket.broadcast.to(from.id).emit('data', `${player.name} has left the room.\n`);
        await player.fromRoom({ $db, socket, room: from.id });

        // Enter room
        socket.broadcast.to(to).emit('data', `${player.name} has entered the room.\n`);
        await player.toRoom({ $db, socket, room: to });

        // Player scan
        $model.scan({ socket });
      } else {
        socket.emit('data', '^rno exit in that direction!\n');
      }
    },

    chat: async ({ $model, socket, event }) => {
      const player = await $model.get();
      socket.broadcast.to(player.room).emit('data', `${player.name} says ${event}\n`);
      socket.emit('data', `You say ${event}\n`);
    },
  },
};
