// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject, of, empty } from 'rxjs';
import { tap, map, concatMap, publish, take, share, retry, catchError } from 'rxjs/operators';

const streams = new WeakMap();

export default class Stream {
  constructor(model) {
    this.model = model;
    if (!streams.has(model)) streams.set(model, { subject: new Subject(), actions: [] });
  }

  push(...actions) {
    streams.get(this.model).actions.push(...actions);
  }

  // pull(...actions) {
  //   streams.get(this.model).actions.find(...args);
  // }

  // pullBy(...args) {
  //   streams.get(this.model).actions.find(...args);
  // }

  pop() {
    streams.get(this.model).actions.pop();
  }

  find(...args) {
    streams.get(this.model).actions.find(...args);
  }

  empty() {
    streams.get(this.model).actions.length = 0;
  }
}

// // Operators
// export const stream = () => {};
// export const action = (...args) => {};
// export const loop = () => {};
// export const delay = () => {};


// export const createAction = (...operators) => () => of('action').pipe(
//   ...operators,
//   catchError((e) => {
//     if (e instanceof AbortActionError) return empty();
//     throw e;
//   }),
//   take(1),
//   share(),
// );

// export const createLoop = (...operators) => () => of('loop').pipe(
//   ...operators,
//   map(() => { throw new Error('repeat'); }),
//   catchError((e) => {
//     if (e instanceof AbortActionError) return empty();
//     throw e;
//   }),
//   take(1),
//   retry(),
//   share(),
// );

// export const writeStream = (id, action) => {
//   if (streams[id]) {
//     streams[id].next(action);
//   } else {
//     streams[id] = new Subject().pipe(
//       tap((hook) => {
//         if (hook === 'abort') throw new AbortActionError('Abort Stream');
//       }),
//       concatMap(thunk => thunk().pipe(
//         catchError((e) => {
//           if (e instanceof AbortActionError) throw e;
//           console.log(e);
//           return of(e);
//         }),
//       )),
//       retry(),
//       publish(),
//     );
//     streams[id].connect();
//     streams[id].next(action);
//   }
// };

// export const closeStream = (id) => {
//   delete streams[id];
// };
