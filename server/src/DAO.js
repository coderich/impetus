import { map, daoMethods, resolveDataObject } from './Util';
import Model from './Model';

export default class Dao {
  constructor($emitter, db, ram, config, models, sockets) {
    const $dao = { db: {}, ram: {}, config: {} };
    Dao.wrapInstance($dao, $emitter, $dao.db, db, models, sockets);
    Dao.wrapInstance($dao, $emitter, $dao.ram, ram, models, sockets);
    Dao.wrapInstance($dao, $emitter, $dao.config, config, models, sockets);
    return $dao;
  }

  static wrapInstance($dao, $emitter, wrapper, instance, models, sockets) {
    const config = { writable: true, enumerable: false, configurable: true };

    Object.defineProperties(wrapper, daoMethods.filter(method => method !== 'hydrate').reduce((prev, method) => {
      return Object.assign(prev, {
        [method]: {
          value: (key, ...rest) => Promise.resolve(instance[method](key, ...rest)).then((value) => {
            if (value == null) return value;
            if (typeof value !== 'object') return value;
            if (Array.isArray(value)) return value;
            const [root] = key.split('.');
            return new Model($dao, $emitter, wrapper, key, value, models[root], sockets);
          }),
          ...config,
        },
      });
    }, {}));

    Object.defineProperties(wrapper, {
      ref: {
        value: (key) => {
          const [root] = key.split('.');
          return new Model($dao, $emitter, wrapper, key, {}, models[root], sockets);
        },
        ...config,
      },
      hydrate: {
        value: (key, defaultValue) => instance.get(key).then((value) => {
          if (typeof value === 'object' && !Array.isArray(value)) {
            return resolveDataObject(Object.entries(value).reduce((prev, [k, v]) => Object.assign(prev, { [k]: wrapper.get(v) }), {}));
          }
          return map(value, li => wrapper.get(li), true);
        }).then((value = defaultValue) => value),
        ...config,
      },
    });

    return wrapper;
  }
}
