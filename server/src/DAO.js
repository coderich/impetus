import { map, daoMethods } from './Util';
import Model from './Model';

export default class Dao {
  constructor(instance, models) {
    const config = { writable: true, enumerable: false, configurable: true };

    const dao = Object.defineProperties({}, daoMethods.reduce((prev, method) => {
      return Object.assign(prev, {
        [method]: {
          value: (key, ...rest) => Promise.resolve(instance[method](key, ...rest)).then((value) => {
            if (value == null) return value;
            if (typeof value !== 'object') return value;
            if (Array.isArray(value)) return value;
            const [root] = key.split('.');
            return new Model(dao, key, value, models[root]);
          }),
          ...config,
        },
      });
    }, {}));

    Object.defineProperties(dao, {
      ref: {
        value: (key) => {
          const [root] = key.split('.');
          return new Model(dao, key, {}, models[root]);
        },
        ...config,
      },
      hydrate: {
        value: (key, prefix) => instance.get(key).then(value => map(value, li => dao.get([prefix, li].filter(Boolean).join('.')), true)),
        ...config,
      },
    });

    return dao;
  }
}
