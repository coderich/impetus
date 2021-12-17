import { chance } from './service';

export default {
  Room: {
    car: {
      name: 'Roadside',
      description: chance.paragraph(),
      exits: { n: 'Room.street' },
    },
    street: {
      name: 'Dead-End Road',
      description: chance.paragraph(),
      exits: { n: 'Room.house', s: 'Room.car' },
    },
    house: {
      name: 'Dead-End',
      description: chance.paragraph(),
      exits: { w: 'Room.foyer', s: 'Room.street' },
      // hint: '',
      // keywords: {},
      // spawns: ['1d1000+1000', '1d3', 'Creature.ant', 'Creature.rat'],
    },
    foyer: {
      name: 'House (foyer)',
      description: chance.paragraph(),
      exits: { w: 'Room.living', e: 'Room.house' },
    },
    living: {
      name: 'House (living room)',
      description: chance.paragraph(),
      exits: { n: 'Room.dining', e: 'Room.foyer' },
    },
    dining: {
      name: 'House (dining room)',
      description: chance.paragraph(),
      exits: { w: 'Room.kitchen', n: 'Room.den', s: 'Room.living' },
    },
    kitchen: {
      name: 'House (kitchen)',
      description: chance.paragraph(),
      exits: { e: 'Room.dining' },
    },
    den: {
      name: 'House (den)',
      description: chance.paragraph(),
      exits: { s: 'Room.dining' },
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
    riddler: {
      name: 'The Riddler',
      room: 'Room.car',
      commands: {
        greet: ({ socket }) => socket.emit('data', 'hello\n'),
        ask: ({ socket, event: query }) => {
          switch (query) {
            case 'riddle': return socket.emit('data', 'Yes!\n');
            default: return '';
          }
        },
      },
    },
  },
};
