import EventEmitter from 'events';
import { promiseChain } from './Util';

/**
 * ChainEmitter.
 *
 * The difference is that I'm looking at each raw listeners to determine how many arguments it's expecting.
 * If it expects more than 1 we block and wait for it to finish before calling the next listener.
 */
export default class ChainEmitter extends EventEmitter {
  emit(event, data) {
    return promiseChain(this.rawListeners(event).map((wrapper) => {
      return () => new Promise((resolve, reject) => {
        const next = () => resolve(data);
        const numArgs = (wrapper.listener || wrapper).length;
        Promise.resolve(wrapper(data, next)).then((result = data) => result).catch(e => reject(e));
        if (numArgs < 2) next();
      });
    })).then((results) => {
      return results.pop() || data;
    });
  }
}

export const emitter = new ChainEmitter();
