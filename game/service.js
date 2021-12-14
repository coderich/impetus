import Chance from 'chance';

export const chance = new Chance();
export const numToArray = num => Array.from(Array(num));
export const titleCase = name => name.charAt(0).toUpperCase() + name.slice(1);
export const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
export const timeout = ms => new Promise(res => setTimeout(res, ms));

export const roll = (dice) => {
  if (typeof dice !== 'string') return dice;

  const input = dice.match(/\S+/g).join('');
  const [, rolls, sides, op = '+', mod = 0] = input.match(/(\d+)d(\d+)([+|-|\\*|\\/]?)(\d*)/);

  const value = numToArray(Number.parseInt(rolls, 10)).reduce((prev, curr) => {
    return prev + chance.integer({ min: 1, max: sides });
  }, 0);

  return eval(`${value} ${op} ${mod}`); // eslint-disable-line
};
