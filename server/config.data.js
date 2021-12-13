import Chance from 'chance';

const chance = new Chance();

export default {
  rooms: {
    a: {
      name: 'Hallway South',
      description: chance.paragraph(),
      exits: { n: 'b' },
    },
    b: {
      name: 'Hallway North',
      description: chance.paragraph(),
      exits: { s: 'a' },
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
