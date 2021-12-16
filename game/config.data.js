import { chance } from './service';

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
      spawns: ['1d1000+1000', '1d2', 'Creature.ant', 'Creature.rat'],
    },
  },

  Creature: {
    ant: {
      name: 'ant',
    },
    rat: {
      name: 'rat',
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
