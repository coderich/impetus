import { createClient } from 'redis';
import { map } from './Util';

export default class Redis {
  constructor(config) {
    this.prefix = config.name ? `${config.name}.` : '';
    this.client = createClient();
  }

  connect() {
    return this.client.connect();
  }

  get(key, defaultValue) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.get(id, { path: field.join('.') }).then((value = defaultValue) => value).catch(() => defaultValue);
  }

  set(key, value) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.set(id, `.${field.join('.')}`, value).then(() => value);
  }

  del(key) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.del(id, `.${field.join('.')}`);
  }

  push(key, value) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.arrAppend(id, `.${field.join('.')}`, value).catch(() => this.set(key, [value]));
  }

  pull(key, value) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.arrIndex(id, `.${field.join('.')}`, value).then((index) => {
      if (index < 0) return null;
      return this.client.json.arrPop(id, `$.${field.join('.')}`, index);
    });
  }

  inc(key, by = 1) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.numIncrBy(id, `.${field.join('.')}`, by);
  }

  hydrate(key, prefix) {
    return this.get(key).then(value => map(value, li => this.get([prefix, li].filter(Boolean).join('.')), true));
  }
}
