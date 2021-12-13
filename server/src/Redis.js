import { get } from 'lodash';
import { createClient } from 'redis';
import { map } from './Util';

export default class Redis {
  constructor() {
    this.client = createClient();
  }

  connect() {
    return this.client.connect();
  }

  get(key, defaultValue) {
    const [id, ...field] = key.split('.');
    return this.client.json.get(id, { path: field.join('.') }).then((value = defaultValue) => value).catch(() => defaultValue);
  }

  set(key, value) {
    const [id, ...field] = key.split('.');
    return this.client.json.set(id, `.${field.join('.')}`, value).then(() => value);
  }

  del(key) {
    const [id, ...field] = key.split('.');
    return this.client.json.del(id, `.${field.join('.')}`);
  }

  ref(key) {
    return map(this.get(key), li => this.get(li), true);
  }

  push(key, value) {
    const [id, ...field] = key.split('.');
    return this.client.json.arrAppend(id, `.${field.join('.')}`, value);
  }

  async pull(key, value) {
    const [id, ...field] = key.split('.');
    const index = await this.client.json.arrindex(id, `.${field.join('.')}`, value);
    if (index < 0) return null;
    return this.client.json.arrPop(id, `.${field.join('.')}`, index);
  }

  inc(key, by = 1) {
    const [id, ...field] = key.split('.');
    return this.client.json.numIncrBy(id, `.${field.join('.')}`, by);
  }
}
