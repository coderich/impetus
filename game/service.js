import { get } from 'lodash';
import Chance from 'chance';
import Swig from 'swig-templates';

export const chance = new Chance();
export const numToArray = num => Array.from(Array(num));
export const titleCase = name => name.charAt(0).toUpperCase() + name.slice(1);
export const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
export const timeout = ms => new Promise(res => setTimeout(res, ms));
export const directions = { n: 'north', s: 'south', e: 'east', w: 'west', ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest', u: 'up', d: 'down' }; // eslint-disable-line
export const rdirections = { n: 'south', s: 'north', e: 'west', w: 'east', ne: 'southwest', nw: 'southeast', se: 'northwest', sw: 'northeast', u: 'down', d: 'up' }; // eslint-disable-line

export const map = (mixed, fn, promise = false) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map(el => fn(el));
  if (isArray) return promise ? Promise.all(results) : results;
  return results[0];
};

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
  const words = target.toLowerCase().split(' ').map(w => w.trim());

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

export const fromTemplate = async ($dao, template) => {
  const id = await $dao.db.inc('autoIncrement');
  const [root] = template.split('.');
  const key = `${root}.${id}`;
  const data = await $dao.config.get(template);
  data.template = template;
  return $dao.db.set(key, data);
};

export const spawn = ($this, $dao, spawns = [], locals = {}) => {
  const now = new Date().getTime();

  return Promise.all(spawns.map(async (el) => {
    const { spawn: details, to, assign, respawnAt, cmd = 'push' } = el;
    const [respawn, num, ...templates] = details;

    if (!respawnAt || (respawn && now > respawnAt)) {
      el.respawnAt = now + roll(respawn);
      const existingTemplates = await $this.hydrate(Swig.render(to, { locals }), []).then(models => models.map(model => model.template).filter(Boolean));
      const newTemplates = Array.from(Array(roll(num))).map(() => randomElement(templates)).filter(template => existingTemplates.indexOf(template) === -1);

      return Promise.all(newTemplates.map(template => fromTemplate($dao, template))).then((models) => {
        return Promise.all(models.map((model) => {
          return Promise.all([
            $this[cmd](Swig.render(to, { locals }), model.$id),
            assign ? model.set(assign, $this.$id) : Promise.resolve(),
          ]).then(() => (model.init ? model.init() : Promise.resolve()));
        }));
      });
    }

    return Promise.resolve();
  })).then((models) => {
    return $this.set('spawns', spawns).then(() => models);
  });
};

export const attackOutcome = (source, target, attack) => {
  const { acc, dmg } = attack;
  const outcome = { hit: false, verb: randomElement(attack.misses) };
  const hitRoll = roll(acc.base) + Object.entries(acc.mod).reduce((prev, [k, v]) => prev + source.stats[k] * v, 0);

  if (hitRoll >= target.stats.ac) {
    outcome.hit = true;
    outcome.dmg = roll(dmg.base) + Object.entries(dmg.mod).reduce((prev, [k, v]) => prev + source.stats[k] * v, 0);
    outcome.verb = randomElement(attack.hits);
  }

  return outcome;
};
