export default {
  punch: {
    type: 'B',
    acc: {
      base: '3d5+5',
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
    hits: ['punch', 'hit', 'strike', 'jab'],
    misses: ['swing', 'lunge'],
  },
  kick: {},
  claw: {},
  bite: {
    type: 'P',
    acc: {
      base: '3d5+5',
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