export default {
  rooms: {
    a: {
      exits: { n: 'room.b' },
    },
    b: {
      exits: { s: 'room.a' },
    },
  },

  npcs: {
    rich: {
      name: 'Rich',
      age: 43,
    },
    anne: {
      name: 'Anne',
      age: 38,
    },
  },
};
