import Chance from 'chance';

const chance = new Chance();

export default {
  Room: {
    a: {
      name: 'Hallway South',
      description: chance.paragraph(),
      exits: { n: 'Room.b' },
    },
    b: {
      name: 'Hallway North',
      description: chance.paragraph(),
      exits: { s: 'Room.a' },
    },
  },

  NPC: {
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
