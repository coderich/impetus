import { directions, spawn } from '../service';

export default {
  install: async ({ $this, $dao }) => {
    if (!$this.items) await $this.set('items', []);
    if (!$this.units) await $this.set('units', []);
  },

  displayName: () => null,

  enter: ({ $this, $dao, player, from, to }) => {
    player.socket.broadcast.to(to.$id).emit('data', `${player.name} has entered the room.`);
    $this.flow.get('enter').pipe(() => {});
    return player.toRoom({ $dao, room: to });
  },

  exit: ({ $dao, player, from, to }) => {
    player.socket.broadcast.to(from.$id).emit('data', `^y${player.name}^ has left the room.`);
    return player.fromRoom({ $dao, room: from.$id });
  },

  look: async ({ $this, $dao, brief = false, filter = () => true }) => {
    const room = await $this.get();
    await spawn(room, $dao, room.spawns);
    const units = await room.hydrate('units', []).then(results => results.filter(filter));
    const items = await room.hydrate('items', []);
    const exits = await room.hydrate('exits', {});
    const description = !brief && room.description ? `    ${room.description}\n^:` : '';
    const notice = items.length ? `^cYou notice ${items.map(i => i.name).join(', ')} here.\n` : '';
    const alsoHere = units.length ? `^mAlso here:^ ${units.map(u => u.displayName()).join(', ')}\n` : '';
    const obviousExits = `^gObvious exits: ${Object.entries(exits).map(([k, v]) => [v.displayName(), directions[k]].filter(Boolean).join(' ')).join(', ')}`;
    return `^+^C${room.name}\n^:${description}${notice}${alsoHere}${obviousExits}`;
  },
};
