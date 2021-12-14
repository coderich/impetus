// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject, of, empty } from 'rxjs';
import { tap, map, concatMap, publish, take, share, retry, catchError } from 'rxjs/operators';

export default class Flow {
  constructor(...observables) {
    this.observables = observables;
  }
}

// Operators
export const stream = () => {};
export const action = (...args) => {};
export const loop = () => {};
export const delay = () => {};


export const createAction = (...operators) => () => of('action').pipe(
  ...operators,
  catchError((e) => {
    if (e instanceof AbortActionError) return empty();
    throw e;
  }),
  take(1),
  share(),
);
