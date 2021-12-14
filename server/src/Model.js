import { daoMethods } from './Util';

/**
 * Model
 *
 * Converts the passed in value to a "model" with DAO + user-defined methods attached
 */
export default class Model {
  constructor(dao, key, value, model = {}) {
    const config = { writable: true, enumerable: false, configurable: true };
    const root = key.split('.').slice(0, 2);
    value.id = root.join('.');

    /**
     * Here we re-define the DAO methods to allow relative path queries
     */
    Object.defineProperties(value, daoMethods.reduce((prev, daoMethod) => {
      return Object.assign(prev, {
        [daoMethod]: {
          value: (path, ...args) => {
            const fullpath = root.concat(path).filter(Boolean).join('.');
            return dao[daoMethod](`${fullpath}`, ...args);
          },
          ...config,
        },
      });
    }, {}));

    /**
     * Here we attach user-defined methods and curry in $model and $dao
     */
    Object.defineProperties(value, Object.entries(model).reduce((prev, [k, v]) => {
      return Object.assign(prev, {
        [k]: {
          value: event => v(Object.assign({}, event, { $dao: dao, $model: value })),
          ...config,
        },
      });
    }, {}));

    /**
     * Additional convenience functions
     */
    Object.defineProperties(value, {
      ref: {
        value: (k, prefix) => value.get(k).then(ref => dao.ref([prefix, ref].filter(Boolean).join('.'))),
        ...config,
      },
    });

    return value;
  }
}
