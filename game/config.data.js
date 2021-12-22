import axios from 'axios';
import { chance } from './service';

export default {
  Room: {
    car: {
      name: 'Roadside, Dirt Path Entrance',
      description: 'You are standing at the entrace of a small dirt path along side a secluded road. From time to time you can hear the whisper of trees as the wind gently blows. A ^yBlack Audi A4^ sits motionless on the side of the road; victim of a flat tire.',
      exits: { n: 'Room.street' },
    },
    street: {
      name: 'Dirt Path',
      description: chance.paragraph(),
      exits: { n: 'Room.yard', s: 'Room.car' },
    },
    yard: {
      name: 'Dirt Path, Dead End',
      description: chance.paragraph(),
      exits: { n: 'Door.shed', s: 'Room.street', w: 'Room.foyer' },
    },
    shed: {
      name: 'Shed',
      description: chance.paragraph(),
      exits: { s: 'Door.shed' },
      spawns: ['1d1000+1000', '1d3', 'Creature.ant', 'Creature.rat'],
    },
    foyer: {
      name: 'House, Foyer',
      description: chance.paragraph(),
      exits: { e: 'Room.yard', w: 'Room.living' },
    },
    living: {
      name: 'House, Living Room',
      description: chance.paragraph(),
      exits: { n: 'Room.dining', e: 'Room.foyer' },
    },
    dining: {
      name: 'House, Dining Room',
      description: chance.paragraph(),
      exits: { n: 'Room.den', s: 'Room.living', w: 'Room.kitchen' },
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
            case 'riddle': {
              socket.emit('dialog', `${$this.name} pauses to think for a moment...`);
              return axios.get('http://localhost:3000/riddle').then(({ data }) => {
                if (data.error) return this.default.NPC.riddler.commands.ask({ $this, socket, event: query });
                return socket.emit('dialog', data.riddle, (answer) => {
                  if (answer.toLowerCase() === data.answer.toLowerCase()) return socket.emit('data', 'You smart...');
                  return socket.emit('data', 'You dumb...');
                });
              });
            }
            default: {
              return socket.emit('data', `${$this.name} has nothing to tell you!`);
            }
          }
        },
      },
    },
  },

  Door: {
    shed: {
      status: 'closed',
      connects: { n: 'Room.shed', s: 'Room.yard' },
      // listeners: {
      //   'player:move': async ({ $this, $event }, next) => {
      //     const { to, from } = $event;

      //     if (to.$id === 'Room.shed' && from.$id === 'Room.yard') {
      //       const { status } = await $this.get();

      //       switch (status) {
      //         case 'closed': case 'locked': {
      //           break;
      //         }
      //         default: {
      //           break;
      //         }
      //       }
      //     }

      //     next();
      //   },
      // },
    },
  },
};
