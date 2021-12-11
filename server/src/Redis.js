import { createClient } from 'redis';

const client = createClient();

export const connect = () => client.connect();

export const get = async (id, field = '') => {
  return client.json.get(await Promise.resolve(id), `.${field}`);
};

export const list = async (id, field) => {
  const results = await get(id, field);
  return Promise.all(results.map(li => get(li)));
};

export const set = async (id, ...args) => {
  let field; let data;
  if (args[1] !== undefined) ([field, data] = args);
  else ([field, data] = ['', args[0]]);
  const result = await client.json.set(await Promise.resolve(id), `.${field}`, await Promise.resolve(data));
  if (field === '') return data;
  return result;
};

export const del = async (id, field = '') => {
  return client.json.del(await Promise.resolve(id), `.${field}`);
};

export const push = async (id, field, data) => {
  return client.json.arrappend(await Promise.resolve(id), `.${field}`, await Promise.resolve(data));
};

export const pull = async (id, field, data) => {
  const index = await client.json.arrindex(await Promise.resolve(id), `.${field}`, await Promise.resolve(data));
  if (index < 0) return null;
  return client.json.arrpop(await Promise.resolve(id), `.${field}`, index);
};

export const inc = async (id, field, number) => {
  return client.json.numincrby(await Promise.resolve(id), `.${field}`, number);
};

export default { get, set, del, list, push, pull, inc };
