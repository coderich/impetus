import { createClient } from 'redis';
import { map } from './Util';

export default class Redis {
  constructor(config) {
    this.prefix = config.name ? `${config.name}.` : '';
    this.name = config.name;
    this.keyDepth = config.keyDepth || 1;
    this.client = createClient();
  }

  connect() {
    return this.client.connect();
  }

  keys(key) {
    const fields = key.split('.');
    const id = [this.name].concat(fields.splice(0, this.keyDepth)).filter(Boolean);
    return [id.join('.'), `.${fields.join('.')}`];
  }

  get(key, defaultValue) {
    const [root, ...field] = key.split('.');
    const id = `${this.prefix}${root}`;
    return this.client.json.get(id, { path: field.join('.') }).then((value = defaultValue) => value).catch(() => defaultValue);
  }

  set(key, value) {
    const [id, field] = this.keys(key);
    return this.client.json.set(id, field, value).then(() => value);
  }

  del(key) {
    const [id, field] = this.keys(key);
    return this.client.json.del(id, field);
  }

  push(key, value) {
    const [id, field] = this.keys(key);
    return this.client.json.arrAppend(id, field, value).catch(() => this.set(key, [value]));
  }

  pull(key, value) {
    const [id, field] = this.keys(key);
    return this.client.json.arrIndex(id, field, value).then((index) => {
      if (index < 0) return null;
      return this.client.json.arrPop(id, `$${field}`, index);
    });
  }

  inc(key, by = 1) {
    const [id, field] = this.keys(key);
    return this.client.json.numIncrBy(id, field, by);
  }

  hydrate(key, prefix) {
    return this.get(key).then(value => map(value, li => this.get([prefix, li].filter(Boolean).join('.')), true));
  }
}
