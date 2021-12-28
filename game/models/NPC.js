export default {
  displayName: ({ $this }) => $this.name,

  ask: ({ $this, $dao, player, target }) => {
    if (!target || target === '') return $this.greet({ player });

    return $dao.config.get(`${$this.$id}.ask`).then((fn = () => {}) => {
      return fn({ $this, player, target });
    });
  },

  greet: ({ $this, $dao, player }) => {
    return $dao.config.get(`${$this.$id}.greet`).then((fn = () => {}) => {
      return fn({ $this, $dao, player });
    });
  },
};
