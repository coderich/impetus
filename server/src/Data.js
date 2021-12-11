import { get, set, pull, unset } from 'lodash';
import { map } from './Util';

export default class Data {
  constructor(data) {
    this.data = data;
  }

  get(key, value) {
    return get(this.data, key, value);
  }

  set(key, value) {
    return set(this.data, key, value);
  }

  del(key) {
    return unset(this.data, key);
  }

  ref(key) {
    return map(this.get(key), li => this.get(li));
  }

  push(key, value) {
    return this.get(key, []).push(value);
  }

  pull(key, value) {
    return pull(this.get(key, []), value);
  }

  inc(key, number) {
    return this.set(key, this.get(key, 0) + number);
  }

  static toObject(instance) {
    const ignores = ['constructor'];
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(el => ignores.indexOf(el) === -1);
    return methods.reduce((prev, method) => Object.assign(prev, { [method]: (...args) => instance[method].call(instance, ...args) }), {});
  }
}
