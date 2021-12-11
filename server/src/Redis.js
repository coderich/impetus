import { createClient } from 'redis';
import { map } from './Util';

export default class Redis {
  constructor() {
    this.client = createClient();
  }

  connect() {
    return this.client.connect();
  }

  async get(key, defaultValue) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    return this.client.json.get(id, `.${field.join('.')}`).then((value = defaultValue) => value);
  }

  async set(key, value) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    return this.client.json.set(id, `.${field.join('.')}`, await Promise.resolve(value));
  }

  async del(key) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    return this.client.json.del(id, `.${field.join('.')}`);
  }

  ref(key) {
    return map(this.get(key), li => this.get(li), true);
  }

  async push(key, value) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    return this.client.json.arrappend(id, `.${field.join('.')}`, await Promise.resolve(value));
  }

  async pull(key, value) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    const index = await this.client.json.arrindex(id, `.${field.join('.')}`, await Promise.resolve(value));
    if (index < 0) return null;
    return this.client.json.arrpop(id, `.${field.join('.')}`, index);
  }

  async inc(key, number) {
    const [id, ...field] = await Promise.resolve(key).then(k => k.split('.'));
    return this.client.json.numincrby(id, `.${field.join('.')}`, number);
  }

  static toObject(instance) {
    const ignores = ['constructor', 'connect'];
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(el => ignores.indexOf(el) === -1);
    return methods.reduce((prev, method) => Object.assign(prev, { [method]: (...args) => instance[method].call(instance, ...args) }), {});
  }
}
