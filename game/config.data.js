import { chance } from './service';

export default {
  Room: {
    car: {
      name: 'Roadside',
      description: 'In another ^ylife^ I would make you stay',
      exits: { n: 'Room.street' },
    },
    street: {
      name: 'Side Street',
      description: chance.paragraph(),
      exits: { n: 'Room.house', s: 'Room.car' },
    },
    house: {
      name: 'Side Street, Dead End',
      description: chance.paragraph(),
      exits: { w: 'Room.foyer', s: 'Room.street' },
      // hint: '',
      // keywords: {},
      // spawns: ['1d1000+1000', '1d3', 'Creature.ant', 'Creature.rat'],
    },
    foyer: {
      name: 'House, Foyer',
      description: chance.paragraph(),
      exits: { w: 'Room.living', e: 'Room.house' },
    },
    living: {
      name: 'House, Living Room',
      description: chance.paragraph(),
      exits: { n: 'Room.dining', e: 'Room.foyer' },
    },
    dining: {
      name: 'House, Dining Room',
      description: chance.paragraph(),
      exits: { w: 'Room.kitchen', n: 'Room.den', s: 'Room.living' },
    },
    kitchen: {
      name: 'House, Kitchen',
      description: chance.paragraph(),
      exits: { e: 'Room.dining' },
    },
    den: {
      name: 'House, Den',
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
        greet: ({ socket }) => socket.emit('data', '^ghello'),
        ask: ({ $this, socket, event: query }) => {
          switch (query) {
            case 'riddle': return socket.emit('data', 'Yes!');
            default: return socket.emit('data', `${$this.name} has nothing to tell you!`);
          }
        },
      },
    },
  },
};
