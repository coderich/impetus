import { get, set, pull, unset } from 'lodash';
import { map } from './Util';

export default class Data {
  constructor(data) {
    this.data = data;
  }

  get(key, defaultValue) {
    if (!key) return this.data;
    return get(this.data, key, defaultValue);
  }

  set(key, value) {
    set(this.data, key, value);
    return value;
  }

  del(key) {
    return unset(this.data, key);
  }

  push(key, value) {
    return this.get(key, []).push(value);
  }

  pull(key, value) {
    return pull(this.get(key, []), value);
  }

  inc(key, by = 1) {
    return this.set(key, this.get(key, 0) + by);
  }

  hydrate(key, defaultValue) {
    return map(this.get(key), li => this.get(li)) || defaultValue;
  }
}
