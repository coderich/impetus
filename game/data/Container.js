export default {
  den: {
    name: 'chest',
    items: { Player: {} },
    spawns: [
      {
        to: 'items.{{ player.$id }}',
        spawn: [1, 1, 'Key.shed'],
      },
    ],
  },
};
