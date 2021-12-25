import Stream from './Stream';
import { daoMethods } from './Util';

/**
 * Model
 *
 * Converts the passed in value to a "model" with DAO + user-defined methods attached
 */
export default class Model {
  constructor($dao, $emitter, instance, key, value, model = {}, sockets) {
    const root = key.split('.').slice(0, 2);
    return Model.wrapInstance($dao, $emitter, { ...value }, instance, model, root, sockets);
  }

  static wrapInstance($dao, $emitter, wrapper, instance, model, root, sockets) {
    const config = { writable: true, enumerable: false, configurable: true };

    Object.defineProperties(wrapper, {
      $id: {
        value: root.join('.'),
        ...config,
      },
      $type: {
        value: root[0],
        ...config,
      },
    });

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
          ...config,
        },
      });
    }, {}));

    /**
     * Here we attach user-defined methods and curry in $this and $dao
     */
    Object.defineProperties(wrapper, Object.entries(model).reduce((prev, [k, v]) => {
      return Object.assign(prev, {
        [k]: {
          value: event => v(Object.assign({}, event, { $dao, $emitter, $this: wrapper })),
          ...config,
        },
      });
    }, {}));

    /**
     * Additional convenience functions
     */
    Object.defineProperties(wrapper, {
      ref: {
        value: k => wrapper.get(k).then(ref => instance.ref(ref)),
        ...config,
      },
      flow: {
        value: new Stream(wrapper.$id),
        ...config,
      },
      emit: {
        value: (...args) => {
          return sockets[wrapper.$id].emit(...args);
        },
        ...config,
      },
      broadcast: {
        value: {
          to: (...toArgs) => ({
            emit: (...emitArgs) => sockets[wrapper.$id].broadcast.to(...toArgs).emit(...emitArgs),
          }),
        },
        ...config,
      },
      join: {
        value: (...args) => {
          return sockets[wrapper.$id].join(...args);
        },
        ...config,
      },
      leave: {
        value: (...args) => {
          return sockets[wrapper.$id].leave(...args);
        },
        ...config,
      },
    });

    return wrapper;
  }
}
