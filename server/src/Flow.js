import Stream from './Stream';

const modelStreamMap = new WeakMap();

/**
 * Flow
 */
export default class Flow {
  constructor(model) {
    if (!modelStreamMap.has(model)) modelStreamMap.set(model, new Map());
    this.streamMap = modelStreamMap.get(model);
    this.modelId = model.$id;
  }

  get(id) {
    const key = [this.modelId, id].filter(Boolean).join(':');
    if (!this.streamMap.has(key)) this.streamMap.set(key, new Stream());
    return this.streamMap.get(key);
  }

  del(id) {
    const key = [this.modelId, id].filter(Boolean).join(':');
    if (this.streamMap.has(key)) this.streamMap.get(key).abort();
    return this.streamMap.delete(key);
  }

  clear() {
    this.streamMap.values.forEach(stream => stream.abort());
    return this.streamMap.clear();
  }
}
