export const map = (mixed, fn, promise = false) => {
  if (mixed == null) return mixed;
  const isArray = Array.isArray(mixed);
  const arr = isArray ? mixed : [mixed];
  const results = arr.map(el => fn(el));
  if (isArray) return promise ? Promise.all(results) : results;
  return results[0];
};

export const promiseChain = () => {

};
