import { isDirection } from './config.translators';
import { timeout, roll, randomElement, directions, rdirections } from './service';

export default {
  Room: {
    install: async ({ $this }) => {
      const room = await $this.get();
      if (room.spawns) await room.set('respawnTime', new Date().getTime() + roll(room.spawns[0]));
    },

    init: ({ $this }) => {
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
      return `^+^C${$this.name}\n^:${units.length ? `^mAlso here:^ ${units.map(u => u.displayName()).join(', ')}\n` : ''}^gObvious exits: ${Object.keys($this.exits).map(k => directions[k]).join(', ')}`;
    },

    describe: ({ $this, units = [] }) => {
      return `^+^C${$this.name}\n^:${$this.description ? `    ${$this.description}\n^:` : ''}${units.length ? `^mAlso here:^ ${units.map(u => u.displayName()).join(', ')}\n` : ''}^gObvious exits: ${Object.keys($this.exits).map(k => directions[k]).join(', ')}`;
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

    displayName: ({ $this }) => `^M${$this.name}`,

    scan: async ({ $this, socket }) => {
      const room = await $this.hydrate('room');
      const units = await room.hydrate('units').then(arr => arr.filter(el => el.$id !== $this.$id));
      socket.emit('data', room.scan({ units }));
    },

    look: ({ $this, socket, event: target }) => {
      return $this.flow.get().fork(
        'look',
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
            if (!to) throw new Error('There is no exit in that direction!');
            return socket.emit('data', to.describe({ units: await to.hydrate('units') }));
          }
        },
      ).subscribe({
        error: e => socket.emit('data', e.message),
      });
    },

    open: ({ $this, socket, event: target }) => {
      return $this.flow.get().fork(
        'open',
        async () => {
          if (target === '') throw new Error('^rSyntax: OPEN {Direction|Item}');

          const player = await $this.get();
          const room = await player.hydrate('room');

          if (isDirection(target)) {
            const obstacles = await room.hydrate(`obstacles.${target}`, []);
            if (obstacles.length === 0) throw new Error('There is nothing to open in that direction.');
            await obstacles.map(o => (o.open ? o.open() : Promise.resolve()));
          }
        },
      ).subscribe({
        error: e => socket.emit('data', e.message),
      });
    },

    move: ({ $this, $dao, $emitter, socket, event: dir }) => {
      return $this.flow.get().fork(
        'move',
        // Intent
        async () => {
          const player = await $this.get();
          const from = await $this.hydrate('room');
          const to = await from.hydrate(`exits.${dir}`);
          const obstacles = await from.hydrate(`obstacles.${dir}`);
          return { player, from, to, obstacles };
        },
        // Hinderences
        async ({ player, from, to, obstacles }) => {
          if (!to) throw new Error('There is no exit in that direction!');
          if (obstacles) await obstacles.map(o => (o.move ? o.move() : Promise.resolve()));
        },
        // Time to perform
        () => timeout(1000),
        // Move the player
        async ({ player, from, to }) => {
          // Leave room
          socket.broadcast.to(from.$id).emit('data', `^y${player.name}^ has left the room.`);
          await player.fromRoom({ $dao, socket, room: from.$id });

          // Enter room
          socket.broadcast.to(to.$id).emit('data', `${player.name} has entered the room.`);
          await player.toRoom({ $dao, socket, room: to });

          // Player scan
          return $this.scan({ socket });
        },
      ).subscribe({
        error: e => socket.emit('data', e.message),
        // complete: () => {
        //   $emitter.on(`pre:${$this.$id}`, function hijack(action) {
        //     action.abort('You been hijacked');
        //     $emitter.off(`pre:${$this.$id}`, hijack);
        //   });
        // },
      });
    },

    chat: ({ $this, socket, event }) => {
      return $this.flow.get().pipe(
        async ({ $emitter }) => {
          const player = await $this.get();
          return $emitter.emit('player:chat', { player });
        },
        ({ player }) => {
          socket.broadcast.to(player.room).emit('data', `^g${player.name} says "${event}"`);
          socket.emit('data', `^gYou say "${event}"`);
        },
      );
    },

    greet: ({ $this, $dao, socket, event: target }) => {
      $this.flow.get().pipe(
        async () => {
          const room = await $this.hydrate('room');
          const units = await room.hydrate('units').then(results => results.filter(el => el.$id !== $this.$id));
          const $target = units.find(unit => unit.name.toLowerCase().substring(0, target.length) === target);

          if ($target) {
            if ($target.$type === 'NPC') {
              await $dao.config.get(`${$target.$id}.commands.greet`).then((fn = () => {}) => {
                return fn({ $this: $target, $dao, socket });
              });
            }
          }
        },
      );
    },

    ask: ({ $this, $dao, socket, event }) => {
      const { target, query } = event;

      $this.flow.get().pipe(
        async () => {
          const room = await $this.hydrate('room');
          const units = await room.hydrate('units').then(results => results.filter(el => el.$type === 'NPC'));
          const $target = units.find(unit => unit.name.toLowerCase().substring(0, target.length) === target);

          if ($target) {
            await $dao.config.get(`${$target.$id}.commands.ask`).then((fn = () => {}) => {
              return fn({ $this: $target, $dao, socket, event: query.trim() });
            });
          }
        },
      );
    },

    none: ({ $this, socket }) => {
      $this.flow.get().pipe(() => $this.scan({ socket }));
    },

    unknown: ({ $this, socket }) => {
      $this.flow.get().pipe(() => socket.emit('data', 'Your command had no effect.'));
    },
  },

  Creature: {
    install: () => {},

    init: async ({ $this, $dao }) => {
      $this.scan();
      const room = await $dao.db.ref($this.room);

      room.flow.get('enter').subscribe({
        next: () => $this.scan(),
      });
    },

    displayName: ({ $this }) => `^M${$this.name}`,

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
        ({ $target }) => {
          return timeout(1500); // Mandatory recoil at this point
        },
      ).subscribe({
        error: () => $this.scan(),
        complete: () => $this.scan(),
      });
    },
  },

  NPC: {
    install: ({ $this, $dao }) => {
      $dao.db.ref($this.room).push('units', $this.$id);
    },

    init: () => {},

    displayName: ({ $this }) => `^:${$this.name}`,
  },

  Door: {
    install: () => {},

    init: async ({ $this, $dao, $emitter }) => {
      // const { listeners = {} } = await $dao.config.get($this.$id);

      // Object.entries(listeners).forEach(([key, cb]) => {
      //   $emitter.on(key, ($event, next) => cb({ $this, $dao, $emitter, $event }, next));
      // });
    },

    move: ({ $this }) => {
      switch ($this.status) {
        case 'closed': case 'locked': {
          throw new Error(`The door is ${$this.status}.`);
        }
        default: {
          break;
        }
      }
    },

    open: async ({ $this }) => {
      switch ($this.status) {
        case 'open': throw new Error('The door is already open.');
        case 'closed': return $this.set('status', 'open');
        case 'locked': throw new Error('The door is locked.');
        default: {
          break;
        }
      }
    },
  },
};
