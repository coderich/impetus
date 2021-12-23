import { get } from 'lodash';
import { isDirection } from './config.translators';
import { timeout, randomElement, directions, rdirections, findTargetIndex, spawn } from './service';

export default {
  Room: {
    install: async ({ $this, $dao }) => {
      if (!$this.items) await $this.set('items', []);
      if (!$this.units) await $this.set('units', []);
    },

    displayName: () => null,

    enter: ({ $dao, player, from, to }) => {
      player.socket.broadcast.to(to.$id).emit('data', `${player.name} has entered the room.`);
      return player.toRoom({ $dao, room: to });
    },

    exit: ({ $dao, player, from, to }) => {
      player.socket.broadcast.to(from.$id).emit('data', `^y${player.name}^ has left the room.`);
      return player.fromRoom({ $dao, room: from.$id });
    },

    look: async ({ $this, $dao, brief = false, filter = () => true }) => {
      await spawn($this, $dao, $this.spawns);
      const units = await $this.hydrate('units', []).then(results => results.filter(filter));
      const items = await $this.hydrate('items', []);
      const exits = await $this.hydrate('exits', {});
      const description = !brief && $this.description ? `    ${$this.description}\n^:` : '';
      const notice = items.length ? `^cYou notice ${items.map(i => i.name).join(', ')} here.\n` : '';
      const alsoHere = units.length ? `^mAlso here:^ ${units.map(u => u.displayName()).join(', ')}\n` : '';
      const obviousExits = `^gObvious exits: ${Object.entries(exits).map(([k, v]) => [v.displayName(), directions[k]].filter(Boolean).join(' ')).join(', ')}`;
      return `^+^C${$this.name}\n^:${description}${notice}${alsoHere}${obviousExits}`;
    },
  },

  Player: {
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

    scan: async ({ $this }) => {
      const player = await $this.get();
      const room = await player.hydrate('room');
      $this.socket.emit('data', await room.look({ brief: true, filter: el => el.$id !== $this.$id }));
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
            await exit.open({ player: $this });
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

    none: ({ $this }) => {
      $this.flow.get().pipe(() => $this.scan());
    },

    unknown: ({ $this }) => {
      $this.flow.get().pipe(() => $this.socket.emit('data', 'Your command had no effect.'));
    },
  },

  Creature: {
    // install: () => {},

    // init: async ({ $this, $dao }) => {
    //   $this.scan();
    //   const room = await $dao.db.ref($this.room);

    //   room.flow.get('enter').subscribe({
    //     next: () => $this.scan(),
    //   });
    // },

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

    displayName: ({ $this }) => `^:${$this.name}`,
  },

  Door: {
    displayName: ({ $this }) => `${$this.status} door`,

    look: ({ $this, dir }) => {
      return $this.hydrate(`connects.${dir}`).then(conn => conn.look());
    },

    enter: async (event) => {
      const { $this, dir } = event;

      switch ($this.status) {
        case 'closed': case 'locked': {
          throw new Error(`The door is ${$this.status}.`);
        }
        default: {
          event.to = await $this.hydrate(`connects.${dir}`);
          return event.to.enter(event);
        }
      }
    },

    open: async ({ $this, player }) => {
      switch ($this.status) {
        case 'open': throw new Error('The door is already open.');
        case 'locked': throw new Error('The door is locked.');
        case 'closed': {
          await $this.set('status', 'open').then(() => {
            player.socket.emit('data', 'You open the door.');
          });
          break;
        }
        default: break;
      }
    },

    close: async ({ $this, player }) => {
      switch ($this.status) {
        case 'closed': throw new Error('The door is already closed.');
        case 'locked': throw new Error('The door is already closed and locked.');
        case 'open': {
          await $this.set('status', 'closed').then(() => {
            player.socket.emit('data', 'You close the door.');
          });
          break;
        }
        default: break;
      }
    },
  },

  Container: {
    open: async ({ $this, $dao, player, data }) => {
      const container = await $this.get();
      const itemsPath = container.items.Player ? `items.${player.$id}` : 'items';

      if (!get(container, itemsPath)) {
        await $this.set(itemsPath, []);
        await spawn($this, $dao, $this.spawns, { player });
      }

      const items = await container.hydrate(itemsPath, []);

      player.socket.emit('menu', { data, items: items.map(i => i.name) }, async ({ index }) => {
        if (!index) return player.scan();
        const item = items[index - 1];
        const id = await container.pull(itemsPath, item.$id);
        if (!id) return container.open({ player, data: 'That item is no longer there.' });
        await player.push('items', id);
        return container.open({ player, data: `You take the ${item.name}.` });
      });
    },
  },
};
