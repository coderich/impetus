export default {
  shed: {
    name: 'shed',
    toBash: 100,
    toPick: 100,
    status: 'open',
    connects: { n: 'Room.shed', s: 'Room.yard' },
  },
  house: {
    name: 'door',
    toBash: 100,
    toPick: 100,
    status: 'open',
    connects: { w: 'Room.foyer', e: 'Room.house' },
  },
};
