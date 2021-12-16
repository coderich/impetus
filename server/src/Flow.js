import Stream from './Stream';

const modelStreamMap = new Map();

/**
 * Flow
 *
 * Part of the Flow->Stream->Action framework to enable more timing/control over asynchronous events.
 *
 * Maintains a dictionary of Streams for each Model.$id; providing methods to access
 * and manipulate each stream by an arbitrary name.
 *
 * Needed because each Model is instantiated every time data is accessed via the $dao. This class
 * ensures that we get the same Stream instance each time we call Model.flow methods.
 */
export default class Flow {
  constructor(modelId) {
    if (!modelStreamMap.has(modelId)) modelStreamMap.set(modelId, new Map());
    this.streamMap = modelStreamMap.get(modelId);
    this.modelId = modelId;
  }

  get(name) {
    const key = [this.modelId, name].filter(Boolean).join(':');
    if (!this.streamMap.has(key)) this.streamMap.set(key, new Stream());
    return this.streamMap.get(key);
  }

  del(name) {
    const key = [this.modelId, name].filter(Boolean).join(':');
    if (this.streamMap.has(key)) this.streamMap.get(key).abort();
    return this.streamMap.delete(key);
  }

  clear() {
    this.streamMap.values.forEach(stream => stream.abort());
    return this.streamMap.clear();
  }
}
