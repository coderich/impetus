import { map, daoMethods } from './Util';
import Model from './Model';

export default class Dao {
  constructor(db, data, models) {
    const $dao = { db: {}, data: {} };
    Dao.wrapInstance($dao, $dao.db, db, models);
    Dao.wrapInstance($dao, $dao.data, data, models);
    return $dao;
  }

  static wrapInstance($dao, wrapper, instance, models) {
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
        },
      });
    }, {}));

    Object.defineProperties(wrapper, {
      ref: {
        value: (key) => {
          const [root] = key.split('.');
          return new Model(wrapper, key, {}, models[root]);
        },
      },
      hydrate: {
        value: (key, prefix) => instance.get(key).then(value => map(value, li => wrapper.get([prefix, li].filter(Boolean).join('.')), true)),
      },
    });

    return wrapper;
  }
}
