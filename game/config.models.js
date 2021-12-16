import { isDirection } from './config.translators';

const timeout = ms => new Promise(res => setTimeout(res, ms));

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
    toRoom: async ({ $this, $dao, socket, room }) => {
      socket.join(room);
      await $dao.db.push(`${room}.units`, $this.$id);
      await $this.set('room', room);
    },

    fromRoom: async ({ $this, $dao, socket, room }) => {
      socket.leave(room);
      await $dao.db.pull(`${room}.units`, $this.$id);
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

    move: async ({ $this, $dao, socket, event: dir }) => {
      $this.flow.get('move').pipe(
        async ({ $stream }) => {
          const player = await $this.get();
          const from = await $this.hydrate('room');
          const to = from.exits[dir];

          if (!to) {
            socket.emit('data', '^rno exit in that direction!\n');
            $stream.abort();
          }

          return { player, from, to };
        },
        () => timeout(1500),
        async ({ player, from, to }) => {
          // Leave room
          socket.broadcast.to(from.$id).emit('data', `${player.name} has left the room.\n`);
          await player.fromRoom({ $dao, socket, room: from.$id });

          // Enter room
          socket.broadcast.to(to).emit('data', `${player.name} has entered the room.\n`);
          await player.toRoom({ $dao, socket, room: to });

          // Player scan
          return $this.scan({ socket });
        }
      );
    },

    chat: async ({ $this, socket, event }) => {
      const player = await $this.get();
      socket.broadcast.to(player.room).emit('data', `${player.name} says ${event}\n`);
      socket.emit('data', `You say ${event}\n`);
    },
  },
};
