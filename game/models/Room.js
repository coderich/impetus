import { directions, spawn } from '../service';

export default {
  install: async ({ $this, $dao }) => {
    if (!$this.items) await $this.set('items', []);
    if (!$this.units) await $this.set('units', []);
  },

  displayName: () => null,

  enter: async ({ $this, $dao, player }) => {
    const room = await $this.get();
    await spawn(room, $dao, room.spawns);
    const units = await $this.hydrate('units');
    const creatures = units.filter(u => u.$type === 'Creature');
    player.broadcast.to($this.$id).emit('data', `{{ "${player.name}" | highlight }} has entered the room.`);
    creatures.forEach(creature => creature.scan());
    await player.toRoom({ $dao, room: $this });
    return $this.combatStatus();
  },

  exit: async ({ $this, $dao, player }) => {
    const creatures = await $this.hydrate('units').then(units => units.filter(u => u.$type === 'Creature'));
    player.broadcast.to($this.$id).emit('data', `{{ "${player.name}" | highlight }} has left the room.`);
    creatures.forEach(creature => creature.scan());
    return player.fromRoom({ $dao, room: $this.$id });
  },

  look: async ({ $this, $dao, brief = false, filter = () => true }) => {
    const room = await $this.get();
    await spawn(room, $dao, room.spawns);
    const units = await room.hydrate('units', []).then(results => results.filter(filter));
    const items = await room.hydrate('items', []);
    const exits = await room.hydrate('exits', {});
    const description = !brief && room.description ? `    ${room.description}\n` : '';
    const notice = items.length ? `{{ "You notice ${items.map(i => i.name).join(', ')} here." | roomNotice }}\n` : '';
    const alsoHere = units.length ? `{{ "Also here:" | roomHere }} ${units.map(u => u.displayName()).join(', ')}\n` : '';
    const obviousExits = `{{ "Obvious exits: ${Object.entries(exits).map(([k, v]) => [v.displayName(), directions[k]].filter(Boolean).join(' ')).join(', ')}" | roomExits }}`;
    return `{{ "${room.name}" | roomTitle }}\n${description}${notice}${alsoHere}${obviousExits}`;
  },

  combatStatus: async ({ $this }) => {
    const units = await $this.hydrate('units');
    units.forEach(unit => unit.emit('room', { units }));
  },
};
