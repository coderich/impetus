import Flow from './Flow';
import { daoMethods } from './Util';

/**
 * Model
 *
 * Converts the passed in value to a "model" with DAO + user-defined methods attached
 */
export default class Model {
  constructor($dao, instance, key, value, model = {}) {
    const root = key.split('.').slice(0, 2);
    value.$id = root.join('.');
    [value.$type] = root;
    return Model.wrapInstance($dao, value, instance, model, root);
  }

  static wrapInstance($dao, wrapper, instance, model, root) {
    /**
     * Here we re-define the DAO methods to allow relative path queries
     */
    Object.defineProperties(wrapper, daoMethods.reduce((prev, daoMethod) => {
      return Object.assign(prev, {
        [daoMethod]: {
          value: (path, ...args) => {
            const fullpath = root.concat(path).filter(Boolean).join('.');
            return instance[daoMethod](`${fullpath}`, ...args);
          },
        },
      });
    }, {}));

    /**
     * Here we attach user-defined methods and curry in $this and $dao
     */
    Object.defineProperties(wrapper, Object.entries(model).reduce((prev, [k, v]) => {
      return Object.assign(prev, {
        [k]: {
          value: event => v(Object.assign({}, event, { $dao, $this: wrapper })),
        },
      });
    }, {}));

    /**
     * Additional convenience functions
     */
    Object.defineProperties(wrapper, {
      ref: {
        value: (k, prefix) => wrapper.get(k).then(ref => instance.ref([prefix, ref].filter(Boolean).join('.'))),
      },
      flow: {
        get() { return new Flow(wrapper); },
      },
    });

    return wrapper;
  }
}
