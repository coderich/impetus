import { daoMethods } from './Util';

export default class Model {
  constructor(dao, key, value, model = {}) {
    const root = key.split('.').slice(0, 2);

    Object.defineProperties(value, daoMethods.reduce((prev, daoMethod) => {
      return Object.assign(prev, {
        [daoMethod]: {
          value: (path, ...args) => {
            const fullpath = root.concat(path).filter(Boolean).join('.');
            return dao[daoMethod](`${fullpath}`, ...args);
          },
          writable: true,
          enumerable: false,
          configurable: true,
        },
      });
    }, {}));

    Object.defineProperties(value, Object.entries(model).reduce((prev, [k, v]) => {
      return Object.assign(prev, {
        [k]: {
          value: event => v(Object.assign({}, event, { $model: value })),
          writable: true,
          enumerable: false,
          configurable: true,
        },
      });
    }, {}));

    Object.defineProperties(value, {
      ref: {
        value: k => value.get(k).then(ref => dao.ref(ref)),
        writable: true,
        enumerable: false,
        configurable: true,
      },
    });

    return value;
  }
}
