import { chance } from '../service';

export default {
  car: {
    name: 'Roadside, Dirt Path Entrance',
    description: 'You are standing at the entrace of a small dirt path along side a secluded road. From time to time you can hear the whisper of trees as the wind gently blows. A {{ "Black Audi A4" | highlight }} sits motionless on the side of the road; victim of a flat tire.',
    exits: { n: 'Room.path' },
    env: 'Env.path',
  },
  path: {
    name: 'Dirt Path',
    description: chance.paragraph(),
    exits: { n: 'Room.yard', s: 'Room.car' },
    env: 'Env.path',
  },
  yard: {
    name: 'House, Yard',
    description: chance.paragraph(),
    exits: { n: 'Door.shed', s: 'Room.path', w: 'Room.house' },
    env: 'Env.grass',
    spawns: [
      {
        to: 'items',
        spawn: [null, 1, 'Container.den'],
      },
    ],
  },
  shed: {
    name: 'Dingy Shed',
    description: chance.paragraph(),
    exits: { s: 'Door.shed' },
    spawns: [
      {
        to: 'units',
        assign: 'room',
        spawn: ['1d1000+1000', '2d3', 'Creature.ant', 'Creature.rat'],
      },
    ],
  },
  house: {
    name: 'House, Entrance',
    description: chance.paragraph(),
    exits: { e: 'Room.yard', w: 'Door.house' },
  },
  foyer: {
    name: 'House, Foyer',
    description: chance.paragraph(),
    exits: { e: 'Door.house', w: 'Room.living' },
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
    units: ['NPC.riddler'],
  },
  den: {
    name: 'House, Den',
    description: chance.paragraph(),
    exits: { s: 'Room.dining' },
    spawns: [
      {
        to: 'items',
        spawn: [null, 1, 'Container.den'],
      },
    ],
  },
};
