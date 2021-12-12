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
    return this.client.json.get(id, `.${field.join('.')}`).then((value = defaultValue) => value);
  }

  set(key, value) {
    const [id, ...field] = key.split('.');
    return this.client.json.set(id, `.${field.join('.')}`, value);
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
    return this.client.json.arrappend(id, `.${field.join('.')}`, value);
  }

  async pull(key, value) {
    const [id, ...field] = key.split('.');
    const index = await this.client.json.arrindex(id, `.${field.join('.')}`, value);
    if (index < 0) return null;
    return this.client.json.arrpop(id, `.${field.join('.')}`, index);
  }

  inc(key, number) {
    const [id, ...field] = key.split('.');
    return this.client.json.numincrby(id, `.${field.join('.')}`, number);
  }
}
