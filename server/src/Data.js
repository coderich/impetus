import { get, set, pull, unset } from 'lodash';

const map = (mixed, fn) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map(el => fn(el));
  return isArray ? results : results[0];
};

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

  static create(data) {
    const instance = new Data(data);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(el => ['constructor'].indexOf(el) === -1);
    return methods.reduce((prev, method) => Object.assign(prev, { [method]: (...args) => instance[method].call(instance, ...args) }), {});
  }
}
