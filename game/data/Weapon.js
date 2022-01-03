export default {
  punch: {
    type: 'B',
    acc: {
      base: '1d5+5',
      mod: { dex: 1.00 },
    },
    dmg: {
      base: '1d3',
      mod: { str: 1.00 },
    },
    speed: {
      base: 1000,
      mod: { dex: 2.00 },
    },
    name: 'fist',
    hits: ['punch', 'hit', 'strike', 'jab'],
    misses: ['swing', 'lunge'],
  },
  kick: {},
  claw: {
    type: 'P',
    acc: {
      base: '1d5+5',
      mod: { dex: 1.00 },
    },
    dmg: {
      base: '1d3',
      mod: { str: 2.00 },
    },
    speed: {
      base: 1000,
      mod: { dex: 2.00 },
    },
    name: 'claw',
    hits: ['slash', 'gouge', 'strike'],
    misses: ['swipe'],
  },
  bite: {
    type: 'P',
    acc: {
      base: '1d5+5',
      mod: { dex: 1.00 },
    },
    dmg: {
      base: '1d3',
      mod: { str: 2.00 },
    },
    speed: {
      base: 1000,
      mod: { dex: 2.00 },
    },
    name: 'teeth',
    hits: ['bite', 'chomp', 'gnash'],
    misses: ['lunge', 'snap'],
  },
  sting: {},

  dagger: {},
  rapier: {},
  scimitar: {},
  shortsword: {},
  longsword: {},
  broadsword: {},
  greatsword: {},

  handaxe: {},
  battleaxe: {},
  greataxe: {},

  club: {},
  mace: {},
  hammer: {},
  greatclub: {},
  warhammer: {},
  maul: {},

  pike: {},
  trident: {},

  whip: {},
  sling: {},
  shortbow: {},
  longbow: {},
  crossbow: {},
};
