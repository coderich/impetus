import axios from 'axios';
import { chance } from './service';

export default {
  Room: {
    car: {
      name: 'Roadside, Dirt Path Entrance',
      description: 'You are standing at the entrace of a small dirt path along side a secluded road. From time to time you can hear the whisper of trees as the wind gently blows. A ^yBlack Audi A4^ sits motionless on the side of the road; victim of a flat tire.',
      exits: { n: 'Room.street' },
      spawns: [
        {
          pushTo: 'items',
          spawn: [null, 1, 'Container.den'],
        },
      ],
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
      name: 'Dirty Shed',
      description: chance.paragraph(),
      exits: { s: 'Door.shed' },
      spawns: [
        {
          pushTo: 'units',
          assign: 'room',
          spawn: ['1d1000+1000', '2d3', 'Creature.ant', 'Creature.rat'],
        },
      ],
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
      items: ['Container.den'],
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
      Player: {},
      greet: async ({ $this, player }) => {
        // Load quest progress
        const quest = await $this.get(player.$id, {
          data: `^gHello stranger, people around here call me ^y${$this.name}^g, what can I do for ya?`,
          items: ['*help*'],
        });

        return new Promise((resolve) => {
          player.socket.emit('menu', quest, ({ text }) => {
            switch (text) {
              case '*help*': return this.default.NPC.riddler.help({ $this, player }).then(resolve);
              case '*shed*': return this.default.NPC.riddler.shed({ $this, player }).then(resolve);
              case '*riddle*': return this.default.NPC.riddler.riddle({ $this, player }).then(resolve);
              default: return resolve(player.socket.emit('data', '^gGoodbye'));
            }
          });
        });
      },
      help: ({ $this, player }) => {
        return $this.set(player.$id, {
          data: "^gI may have a spare tire in the ^yshed ^galthough it's been many years since I've gone in there. Go have a look for yourself, you're welcome to anything you can find in that musky old place.",
          items: ['*shed*'],
        }).then((res) => {
          return this.default.NPC.riddler.greet({ $this, player });
        });
      },
      shed: ({ $this, player }) => {
        return $this.set(player.$id, {
          data: "^gThe ^yshed ^gis located out back in the yard; perhaps you'll find something of use there.",
          items: [],
        }).then((res) => {
          return this.default.NPC.riddler.greet({ $this, player });
        });
      },
      riddle: ({ $this, player }) => {
        player.socket.emit('dialog', `${$this.name} pauses to think for a moment...`);
        return axios.get('http://localhost:3000/riddle').then(({ data }) => {
          if (data.error) return this.default.NPC.riddler.riddle({ $this, player });

          return new Promise((resolve) => {
            player.socket.emit('dialog', `^g${data.riddle} `, (answer) => {
              if (answer.toLowerCase() === data.answer.toLowerCase()) return resolve(player.socket.emit('dialog', 'You smart...'));
              return resolve(player.socket.emit('dialog', 'You dumb...'));
            });
          }).then(() => {
            return this.default.NPC.riddler.greet({ $this, player });
          });
        });
      },
    },
  },

  Door: {
    shed: {
      toBash: 100,
      toPick: 100,
      status: 'locked',
      connects: { n: 'Room.shed', s: 'Room.yard' },
    },
  },

  Key: {
    shed: {
      name: 'rusty iron key',
      targets: ['Door.shed'],
    },
  },

  Container: {
    den: {
      name: 'chest',
      items: { Player: {} },
      spawns: [
        {
          pushTo: 'items.{{ player.$id }}',
          spawn: [1, 1, 'Key.shed'],
        },
      ],
    },
  },
};
