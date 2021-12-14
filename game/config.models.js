import { isDirection } from './config.translators';

export default {
  Room: {
    scan: ({ $this, units = [] }) => {
      return `^c${$this.name}\n${units.length ? `^mAlso here: ${units.map(u => u.name).join(', ')}\n` : ''}^gExits: ${Object.keys($this.exits).join(', ')}: `;
    },

    describe: ({ $this, units = [] }) => {
      return `^c${$this.name}\n\t^:${$this.description}\n${units.length ? `^mAlso here: ${units.map(u => u.name).join(', ')}\n` : ''}^gExits: ${Object.keys($this.exits).join(', ')}: `;
    },
  },

  Player: {
    toRoom: async ({ $this, $db, socket, room }) => {
      socket.join(room);
      await $db.push(`${room}.units`, $this.$id);
      await $this.set('room', room);
    },

    fromRoom: async ({ $this, $db, socket, room }) => {
      socket.leave(room);
      await $db.pull(`${room}.units`, $this.$id);
      await $this.del('room');
    },

    scan: async ({ $this, $flow, socket }) => {
      // return $flow.action(async () => {
      const room = await $this.hydrate('room');
      const units = await room.hydrate('units').then(arr => arr.filter(el => el.$id !== $this.$id));
      socket.emit('data', room.scan({ units }));
      // });
    },

    look: async ({ $this, socket, event: target }) => {
      // No target means look in room
      if (target === '') {
        const room = await $this.hydrate('room');
        const units = await room.hydrate('units').then(arr => arr.filter(el => el.$id !== $this.$id));
        return socket.emit('data', room.describe({ units }));
      }

      // Direction check
      if (isDirection(target)) {
        const room = await $this.hydrate('room');
        const to = await room.hydrate(`exits.${target}`);
        if (to) return socket.emit('data', to.describe({ units: await to.hydrate('units') }));
        return socket.emit('data', 'You stare off into a wall...\n');
      }
    },

    move: async ({ $this, $db, socket, event: dir }) => {
      const from = await $this.hydrate('room');
      const to = from.exits[dir];

      if (to) {
        const player = await $this.get();

        // Leave room
        socket.broadcast.to(from.$id).emit('data', `${player.name} has left the room.\n`);
        await player.fromRoom({ $db, socket, room: from.$id });

        // Enter room
        socket.broadcast.to(to).emit('data', `${player.name} has entered the room.\n`);
        await player.toRoom({ $db, socket, room: to });

        // Player scan
        $this.scan({ socket });
      } else {
        socket.emit('data', '^rno exit in that direction!\n');
      }
    },

    chat: async ({ $this, socket, event }) => {
      const player = await $this.get();
      socket.broadcast.to(player.room).emit('data', `${player.name} says ${event}\n`);
      socket.emit('data', `You say ${event}\n`);
    },
  },
};
