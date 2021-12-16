import { map, daoMethods } from './Util';
import Model from './Model';

export default class Dao {
  constructor(db, ram, config, models) {
    const $dao = { db: {}, ram: {}, config: {} };
    Dao.wrapInstance($dao, $dao.db, db, models);
    Dao.wrapInstance($dao, $dao.ram, ram, models);
    Dao.wrapInstance($dao, $dao.config, config, models);
    return $dao;
  }

  static wrapInstance($dao, wrapper, instance, models) {
    const config = { writable: true, enumerable: false, configurable: true };

    Object.defineProperties(wrapper, daoMethods.filter(method => method !== 'hydrate').reduce((prev, method) => {
      return Object.assign(prev, {
        [method]: {
          value: (key, ...rest) => Promise.resolve(instance[method](key, ...rest)).then((value) => {
            if (value == null) return value;
            if (typeof value !== 'object') return value;
            if (Array.isArray(value)) return value;
            const [root] = key.split('.');
            return new Model($dao, wrapper, key, value, models[root]);
          }),
          ...config,
        },
      });
    }, {}));

    Object.defineProperties(wrapper, {
      ref: {
        value: (key) => {
          const [root] = key.split('.');
          return new Model($dao, wrapper, key, {}, models[root]);
        },
        ...config,
      },
      hydrate: {
        value: (key, defaultValue) => instance.get(key).then(value => map(value, li => wrapper.get(li), true)).then((value = defaultValue) => value),
        ...config,
      },
    });

    return wrapper;
  }
}
