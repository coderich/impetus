import Chance from 'chance';

export const chance = new Chance();
export const numToArray = num => Array.from(Array(num));
export const titleCase = name => name.charAt(0).toUpperCase() + name.slice(1);
export const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
export const timeout = ms => new Promise(res => setTimeout(res, ms));
export const directions = { n: 'north', s: 'south', e: 'east', w: 'west', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', u: 'up', d: 'down' }; // eslint-disable-line
export const rdirections = { n: 'south', s: 'north', e: 'west', w: 'east', ne: 'southwest', nw: 'southeast', se: 'northwest', sw: 'northeast', u: 'down', d: 'up' }; // eslint-disable-line

export const roll = (dice) => {
  if (typeof dice !== 'string') return dice;

  const input = dice.match(/\S+/g).join('');
  const [, rolls, sides, op = '+', mod = 0] = input.match(/(\d+)d(\d+)([+|-|\\*|\\/]?)(\d*)/);

  const value = numToArray(Number.parseInt(rolls, 10)).reduce((prev, curr) => {
    return prev + chance.integer({ min: 1, max: sides });
  }, 0);

  return eval(`${value} ${op} ${mod}`); // eslint-disable-line
};

export const findTargetIndex = (target, items) => {
  const words = target.toLowerCase().split(' ');

  return items.findIndex((it) => {
    const tokens = it.toLowerCase().split(' ');

    const info = words.reduce((prev, word) => {
      const { i, found } = prev;
      const j = tokens.slice(i).findIndex(tok => tok.indexOf(word) === 0);
      if (found !== false) return j > -1 ? { found: true, i: j } : { found: false };
      return prev;
    }, { i: 0, found: null });

    return Boolean(info.found);
  });
};
