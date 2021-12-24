import { isDirection } from '../config.translators';
import { timeout, findTargetIndex } from '../service';

export default {
  toRoom: async ({ $this, $dao, room }) => {
    $this.socket.join(room.$id);
    await room.push('units', $this.$id);
    await $this.set('room', room.$id);
  },

  fromRoom: async ({ $this, $dao, room }) => {
    $this.socket.leave(room);
    await $dao.db.pull(`${room}.units`, $this.$id);
  },

  displayName: ({ $this }) => `^M${$this.name}`,

  status: async ({ $this }) => {
    const player = await $this.get();
    return $this.socket.emit('status', player.stats);
  },

  scan: async ({ $this }) => {
    const player = await $this.get();
    const room = await player.hydrate('room');
    $this.socket.emit('data', await room.look({ brief: true, filter: el => el.$id !== $this.$id }));
  },

  take: () => {

  },

  look: ({ $this, event: target }) => {
    return $this.flow.get().fork(
      'look',
      async () => {
        // No target means look in room
        if (target === '') {
          const room = await $this.ref('room');
          return $this.socket.emit('data', await room.look({ filter: el => el.$id !== $this.$id }));
        }

        // Direction check
        if (isDirection(target)) {
          const room = await $this.ref('room');
          const to = await room.hydrate(`exits.${target}`);
          if (!to) throw new Error('There is no exit in that direction!');
          return $this.socket.emit('data', await to.look({ dir: target }));
        }
      },
    ).subscribe({
      error: e => $this.socket.emit('data', e.message),
    });
  },

  open: ({ $this, event: target }) => {
    return $this.flow.get().fork(
      'open',
      async () => {
        if (target === '') throw new Error('^rSyntax: OPEN {Direction|Item}');

        const player = await $this.get();
        const room = await player.hydrate('room');

        // Direction check
        if (isDirection(target)) {
          const exit = await room.hydrate(`exits.${target}`);
          if (!exit || !exit.open) throw new Error('There is nothing to open in that direction.');
          return exit.open({ player: $this });
        }

        // Item check
        const items = await room.hydrate('items', []);
        const index = findTargetIndex(target, items.map(i => i.name));
        const item = items[index];
        if (!item) throw new Error("You don't see that here.");
        if (!item.open) throw new Error("You can't open that!");
        return item.open({ player: $this });
      },
    ).subscribe({
      error: e => $this.socket.emit('data', e.message),
    });
  },

  close: ({ $this, event: target }) => {
    return $this.flow.get().fork(
      'close',
      async () => {
        if (target === '') throw new Error('^rSyntax: CLOSE {Direction|Item}');

        const player = await $this.get();
        const room = await player.hydrate('room');

        if (isDirection(target)) {
          const exit = await room.hydrate(`exits.${target}`);
          if (!exit || !exit.close) throw new Error('There is nothing to close in that direction.');
          await exit.close({ player: $this });
        }
      },
    ).subscribe({
      error: e => $this.socket.emit('data', e.message),
    });
  },

  move: ({ $this, $dao, $emitter, event: dir }) => {
    return $this.flow.get().fork(
      'move',
      async () => {
        const from = await $this.hydrate('room');
        const to = await from.hydrate(`exits.${dir}`);
        if (!to) throw new Error('There is no exit in that direction!');
        return { from, to };
      },
      () => timeout(500),
      async ({ from, to }) => {
        // Enter
        await to.enter({ $dao, player: $this, from, to, dir });

        // Exit
        await from.exit({ $dao, player: $this, from, to, dir });

        // Scan
        return $this.scan();
      },
      () => timeout(500),
    ).subscribe({
      error: e => $this.socket.emit('data', e.message),
    });
  },

  chat: ({ $this, event }) => {
    return $this.flow.get().pipe(
      async ({ $emitter }) => {
        const player = await $this.get();
        return { player };
      },
      ({ player }) => {
        $this.socket.broadcast.to(player.room).emit('data', `^g${player.name} says "${event}"`);
        $this.socket.emit('data', `^gYou say "${event}"`);
      },
    );
  },

  greet: ({ $this, $dao, event: target }) => {
    $this.flow.get().pipe(
      async () => {
        const room = await $this.hydrate('room');
        const units = await room.hydrate('units').then(results => results.filter(el => el.$id !== $this.$id));
        const $target = units.find(unit => unit.name.toLowerCase().substring(0, target.length) === target);

        if ($target) {
          if ($target.$type === 'NPC') {
            await $dao.config.get(`${$target.$id}.greet`).then((fn = () => {}) => {
              return fn({ $this: $target, $dao, player: $this });
            });
          }
        }
      },
    );
  },

  use: ({ $this, event }) => {
    $this.flow.get().pipe(
      async () => {
        let item;
        const items = await $this.hydrate('items');
        const words = event.split(' ').map(w => w.trim());
        const targets = [];

        do {
          const index = findTargetIndex(words.join(' '), items.map(i => i.name));
          if (index > -1) item = items[index];
          else targets.unshift(words.pop());
        } while (!item && words.length);

        if (!item) throw new Error('You do not have that on you!');
        if (!item.use) throw new Error('You cannot use that!');

        return item.use({ player: $this, event: targets.join(' ') });
      }
    ).subscribe({
      error: e => $this.socket.emit('data', e.message),
    });
  },

  inventory: async ({ $this }) => {
    $this.flow.get().pipe(
      async () => {
        const items = await $this.hydrate('items');
        $this.socket.emit('data', items.map(item => item.name).join(', '));
      },
    );
  },

  none: ({ $this }) => {
    $this.flow.get().pipe(() => $this.scan());
  },

  unknown: ({ $this }) => {
    $this.flow.get().pipe(() => $this.socket.emit('data', 'Your command had no effect.'));
  },
};
