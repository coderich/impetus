import { isDirection } from './config.translators';
import { timeout, roll, randomElement } from './service';

export default {
  Room: {
    init: async ({ $this }) => {
      const room = await $this.get();
      if (room.spawns) await room.set('respawnTime', new Date().getTime() + roll(room.spawns[0]));

      $this.flow.get('enter').subscribe({
        next: async () => {
          const now = new Date().getTime();
          const $room = await $this.get();

          if ($room.spawns && now > $room.respawnTime) {
            const units = await $room.hydrate('units', []);
            const creatures = units.filter(unit => unit.$type === 'Creature');
            if (creatures.length === 0) $room.spawn();
          }
        },
      });
    },

    spawn: ({ $this, $dao }) => {
      const [delay, num, ...models] = $this.spawns;

      return Promise.all(Array.from(new Array(roll(num))).map(async () => {
        const id = await $dao.db.inc('autoIncrement');
        const blueprint = randomElement(models);
        const [root] = blueprint.split('.');
        const key = `${root}.${id}`;
        const data = await $dao.config.get(blueprint);
        data.room = $this.$id;
        const unit = await $dao.db.set(key, data);
        await unit.init();
        await $this.push('units', key);
        await $this.set('respawnTime', new Date().getTime() + roll(delay));
      }));
    },

    scan: ({ $this, units = [] }) => {
      return `^c${$this.name}\n${units.length ? `^mAlso here: ${units.map(u => u.name).join(', ')}\n` : ''}^gExits: ${Object.keys($this.exits).join(', ')}: `;
    },

    describe: ({ $this, units = [] }) => {
      return `^c${$this.name}\n\t^:${$this.description}\n${units.length ? `^mAlso here: ${units.map(u => u.name).join(', ')}\n` : ''}^gExits: ${Object.keys($this.exits).join(', ')}: `;
    },
  },

  Player: {
    toRoom: async ({ $this, $dao, socket, room }) => {
      socket.join(room.$id);
      room.flow.get('enter').pipe(() => ({ player: $this }));
      await room.push('units', $this.$id);
      await $this.set('room', room.$id);
    },

    fromRoom: async ({ $this, $dao, socket, room }) => {
      socket.leave(room);
      await $dao.db.pull(`${room}.units`, $this.$id);
      await $this.del('room');
    },

    scan: async ({ $this, socket }) => {
      const room = await $this.hydrate('room');
      const units = await room.hydrate('units').then(arr => arr.filter(el => el.$id !== $this.$id));
      socket.emit('data', room.scan({ units }));
    },

    look: ({ $this, socket, event: target }) => {
      return $this.flow.get().pipe(
        async () => {
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
      );
    },

    move: ({ $this, $dao, socket, event: dir }) => {
      return $this.flow.get().pipe(
        async ({ $stream }) => {
          const player = await $this.get();
          const from = await $this.hydrate('room');
          const to = await from.hydrate(`exits.${dir}`);

          if (!to) {
            socket.emit('data', '^rno exit in that direction!\n');
            $stream.abort();
          }

          return { player, from, to };
        },
        () => timeout(1000),
        async ({ player, from, to }) => {
          // Leave room
          socket.broadcast.to(from.$id).emit('data', `${player.name} has left the room.\n`);
          await player.fromRoom({ $dao, socket, room: from.$id });

          // Enter room
          socket.broadcast.to(to.$id).emit('data', `${player.name} has entered the room.\n`);
          await player.toRoom({ $dao, socket, room: to });

          // Player scan
          return $this.scan({ socket });
        }
      );
    },

    chat: ({ $this, socket, event }) => {
      return $this.flow.get().pipe(
        async () => {
          const player = await $this.get();
          socket.broadcast.to(player.room).emit('data', `${player.name} says ${event}\n`);
          socket.emit('data', `You say ${event}\n`);
        },
      );
    },

    none: ({ $this, socket }) => {
      $this.flow.get().pipe(() => $this.scan({ socket }));
    },
  },

  Creature: {
    init: async ({ $this, $dao }) => {
      $this.scan();
      const room = await $dao.db.ref($this.room);

      room.flow.get('enter').subscribe({
        next: () => $this.scan(),
      });
    },

    scan: async ({ $this }) => {
      const room = await $this.hydrate('room');
      const units = await room.hydrate('units', []);
      const target = randomElement(units.filter(unit => unit.$type === 'Player'));
      if (target) $this.attack({ target });
    },

    move: () => {

    },

    hunt: () => {

    },

    follow: () => {

    },

    attack: ({ $this, $dao, target }) => {
      const stream = $this.flow.get('attack');
      if (stream.actions.length) return;

      stream.pipe(
        // Prep engagement
        () => timeout(1000),

        // Target check
        async ({ $action }) => {
          const $target = await target.get();
          if ($target.room !== $this.room) $action.abort();
          return { $target };
        },

        // Attack
        async ({ $target }) => {
          return timeout(1500); // Mandatory recoil at this point
        },
      ).subscribe({
        error: () => $this.scan(),
        complete: () => $this.scan(),
      });
    },
  },
};
