import { map, daoMethods } from './Util';
import Model from './Model';

export default class DAO {
  constructor(instance, models) {
    const dao = Object.assign(
      daoMethods.reduce((prev, method) => {
        return Object.assign(prev, {
          [method]: (key, ...rest) => Promise.resolve(instance[method](key, ...rest)).then((value) => {
            if (value == null) return value;
            if (typeof value !== 'object') return value;
            if (Array.isArray(value)) return value;
            const [root] = key.split('.');
            return new Model(dao, key, value, models[root]);
          }),
        });
      }, {}), {
        ref: (key) => {
          const [root] = key.split('.');
          return new Model(dao, key, {}, models[root]);
        },
        hydrate: (key) => {
          return instance.get(key).then(value => map(value, li => dao.get(li), true));
        },
      },
    );

    return dao;
  }
}
