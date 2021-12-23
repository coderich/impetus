import { timeout, randomElement } from '../service';

export default {
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
};
