import { isDirection } from '../config.translators';
import { timeout, findTargetIndex, resolveTargetData } from '../service';

export default {
  toRoom: async ({ $this, $dao, room }) => {
    $this.join(room.$id);
    await room.push('units', $this.$id);
    await $this.set('room', room.$id);

    const Rooms = await $dao.config.get('Room');
    const Doors = await $dao.config.get('Door');
    const coords = {
      n: [0, 2, 0],
      s: [0, -2, 0],
      e: [2, 0, 0],
      w: [-2, 0, 0],
    };

    const rooms = Object.entries(Rooms).reduce((arr, [key, value], i) => {
      return arr.concat({
        id: i + 1,
        key: `Room.${key}`,
        name: value.name,
        x: 0,
        y: 0,
        z: 0,
      });
    }, []);

    const exits = Object.values(Rooms).reduce((arr, data, i) => {
      const id = i + 1;

      return arr.concat(Object.entries(data.exits).reduce((obj, [dir, exit]) => {
        const [root, key] = exit.split('.');
        const target = root === 'Room' ? exit : Doors[key].connects[dir];
        const thisRoom = rooms.find(el => el.id === id);
        const nextRoom = rooms.find(el => el.key === target);
        if (nextRoom.id > id) {
          const [x, y, z] = coords[dir];
          nextRoom.x = thisRoom.x + x;
          nextRoom.y = thisRoom.y + y;
          nextRoom.z = thisRoom.z + z;
        }
        return Object.assign(obj, { [dir]: nextRoom.id });
      }, {}));
    }, []);

    $this.emit('map', {
      name: 'impetus',
      room: rooms.find(el => el.key === room.$id).id,
      rooms,
      exits,
    });
  },

  fromRoom: async ({ $this, $dao, room }) => {
    $this.leave(room);
    await $dao.db.pull(`${room}.units`, $this.$id);
  },

  displayName: ({ $this }) => `{{ "${$this.name}" | playerName }}`,

  status: async ({ $this }) => {
    const player = await $this.get();
    return $this.emit('status', player.stats);
  },

  scan: async ({ $this }) => {
    const player = await $this.get();
    const room = await player.hydrate('room');
    $this.emit('data', await room.look({ brief: true, filter: el => el.$id !== $this.$id }));
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
          return $this.emit('data', await room.look({ filter: el => el.$id !== $this.$id }));
        }

        // Direction check
        if (isDirection(target)) {
          const room = await $this.ref('room');
          const to = await room.hydrate(`exits.${target}`);
          if (!to) throw new Error('There is no exit in that direction!');
          return $this.emit('data', await to.look({ dir: target }));
        }
      },
    ).subscribe({
      error: e => $this.emit('data', e.message),
    });
  },

  open: ({ $this, event: target }) => {
    return $this.flow.get().fork(
      'open',
      async () => {
        if (target === '') throw new Error('{{ "Syntax: OPEN {Direction|Item}" | error }}');

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
        const item = items[findTargetIndex(target, items.map(i => i.name))];
        if (!item) throw new Error("You don't see that here.");
        if (!item.open) throw new Error("You can't open that!");
        return item.open({ player: $this });
      },
    ).subscribe({
      error: e => $this.emit('data', e.message),
    });
  },

  close: ({ $this, event: target }) => {
    return $this.flow.get().fork(
      'close',
      async () => {
        if (target === '') throw new Error('{{ "Syntax: CLOSE {Direction|Item}" | error }}');

        const player = await $this.get();
        const room = await player.hydrate('room');

        if (isDirection(target)) {
          const exit = await room.hydrate(`exits.${target}`);
          if (!exit || !exit.close) throw new Error('There is nothing to close in that direction.');
          await exit.close({ player: $this });
        }
      },
    ).subscribe({
      error: e => $this.emit('data', e.message),
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
      error: e => $this.emit('data', e.message),
    });
  },

  chat: ({ $this, event }) => {
    return $this.flow.get().pipe(
      async ({ $emitter }) => {
        const player = await $this.get();
        return { player };
      },
      ({ player }) => {
        $this.broadcast.to(player.room).emit('data', `^g${player.name} says "${event}"`);
        $this.emit('data', `^gYou say "${event}"`);
      },
    );
  },

  greet: ({ $this, $dao, event: target }) => {
    $this.flow.get().pipe(
      async () => {
        const room = await $this.hydrate('room');
        const units = await room.hydrate('units').then(results => results.filter(el => el.$id !== $this.$id));
        const $target = units[findTargetIndex(target, units.map(u => u.name))];

        if ($target) {
          if ($target.$type === 'NPC') return $target.greet({ player: $this });
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
      error: e => $this.emit('data', e.message),
    });
  },

  ask: ({ $this, $dao, event }) => {
    $this.flow.get().pipe(
      async () => {
        const room = await $this.hydrate('room');
        const npcs = await room.hydrate('units', []).then(units => units.filter(unit => unit.$type === 'NPC'));
        const { index, target } = resolveTargetData(event, npcs.map(i => i.name));
        const npc = npcs[index];
        if (!npc) throw new Error('Nobody is here.');
        return npc.ask({ player: $this, target });
      }
    ).subscribe({
      error: e => $this.emit('data', e.message),
    });
  },

  inventory: async ({ $this }) => {
    $this.flow.get().pipe(
      async () => {
        const items = await $this.hydrate('items');
        $this.emit('data', items.map(item => item.name).join(', '));
      },
    );
  },

  none: ({ $this }) => {
    $this.flow.get().pipe(() => $this.scan());
  },

  unknown: ({ $this }) => {
    $this.flow.get().pipe(() => $this.emit('data', 'Your command had no effect.'));
  },
};
