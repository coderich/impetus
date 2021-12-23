export default {
  displayName: ({ $this }) => `${$this.status} ${$this.name || 'door'}`,

  look: ({ $this, dir }) => {
    return $this.hydrate(`connects.${dir}`).then(conn => conn.look());
  },

  enter: async (event) => {
    const { $this, dir } = event;

    switch ($this.status) {
      case 'closed': case 'locked': {
        throw new Error(`The ${$this.name} is ${$this.status}.`);
      }
      default: {
        event.to = await $this.hydrate(`connects.${dir}`);
        return event.to.enter(event);
      }
    }
  },

  open: async ({ $this, player }) => {
    switch ($this.status) {
      case 'open': throw new Error(`The ${$this.name} is already open.`);
      case 'locked': throw new Error(`The ${$this.name} is locked.`);
      case 'closed': {
        await $this.set('status', 'open').then(() => {
          player.socket.emit('data', `You open the ${$this.name}.`);
        });
        break;
      }
      default: break;
    }
  },

  close: async ({ $this, player }) => {
    switch ($this.status) {
      case 'closed': throw new Error(`The ${$this.name} is already closed.`);
      case 'locked': throw new Error(`The ${$this.name} is already closed and locked.`);
      case 'open': {
        await $this.set('status', 'closed').then(() => {
          player.socket.emit('data', `You close the ${$this.name}.`);
        });
        break;
      }
      default: break;
    }
  },

  lock: ({ $this }) => {
    return $this.set('status', 'locked');
  },

  unlock: ({ $this }) => {
    return $this.set('status', 'closed');
  },
};
