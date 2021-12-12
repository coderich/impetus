export const map = (mixed, fn, promise = false) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map(el => fn(el));
  if (isArray) return promise ? Promise.all(results) : results;
  return results[0];
};

export const promiseChain = (promises) => {
  return promises.reduce((chain, promise) => {
    return chain.then(chainResults => promise([...chainResults]).then(promiseResult => [...chainResults, promiseResult]));
  }, Promise.resolve([]));
};

export const resolveDataObject = (obj) => {
  return Promise.all(Object.keys(obj).map(async (key) => {
    const value = await obj[key];
    return { key, value };
  })).then((results) => {
    return results.reduce((prev, { key, value }) => {
      return Object.assign(prev, { [key]: value });
    }, {});
  }).then((results) => {
    if (Array.isArray(obj)) return Object.values(results);
    return results;
  });
};

export const daoMethods = ['get', 'set', 'del', 'ref', 'push', 'pull', 'inc'];

export const toDataAccessObject = (instance) => {
  return daoMethods.reduce((prev, method) => Object.assign(prev, {
    [method]: async (...args) => instance[method].call(instance, ...await resolveDataObject(args)),
  }), {});
};
