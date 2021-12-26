import { roll, timeout, randomElement, resolveAttack } from '../service';

export default {
  init: async ({ $this, $dao }) => {
    const creature = await $this.get();
    const newStats = Object.entries(creature.stats).reduce((prev, [k, v]) => Object.assign(prev, { [k]: roll(v) }), {});
    await $this.set('stats', newStats);
    return $this.scan();
  },

  displayName: ({ $this }) => `{{ "${$this.name}" | creatureName }}`,

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

  attack: async ({ $this, $dao, target }) => {
    const creature = await $this.get();
    const stream = $this.flow.get('attack');
    if (stream.actions.length) return;

    stream.pipe(
      // Prep engagement
      () => timeout(1000),

      // Target check
      async ({ $action }) => {
        const $target = await target.get();
        if ($target.room !== creature.room) $action.abort();
        return { $target };
      },

      // Attack
      async ({ $target }) => {
        const attack = await $dao.db.get(randomElement(creature.attacks));
        await resolveAttack(creature, $target, attack);
        return timeout(1500); // Mandatory recoil at this point
      },
    ).subscribe({
      error: () => $this.scan(),
      complete: () => $this.scan(),
    });
  },
};
