// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject, of, throwError } from 'rxjs';
import { tap, concatMap, retry, publish } from 'rxjs/operators';
import { AbortStreamError } from './Error';
import { emitter } from './ChainEmitter';
import Action from './Action';

const streamMap = new Map();

/**
 * Stream
 *
 * Part of the Flow->Stream->Action framework to enable more timing/control over asynchronous events.
 */
export default class Stream {
  constructor(id) {
    this.id = id;
    this.actions = [];
    this.closed = false;
    this.paused = false;
    this.subject = new Subject();

    this.observable = this.subject.pipe(
      tap((action) => {
        if (action instanceof AbortStreamError) {
          throw action;
        }
      }),

      concatMap(async (action) => {
        if (this.paused) await this.paused;

        return emitter.emit(`pre:${id}`, action).then(() => {
          return action.exec().then((result) => {
            return emitter.emit(`post:${id}`, result);
          });
        }).catch((e) => {
          if (e instanceof AbortStreamError) throw e;
          return of(e);
        }).finally(() => {
          this.actions.shift();
        });
      }),

      retry(),
      publish()
    );

    this.observable.connect();
  }

  get(name) {
    const key = [this.id, name].filter(Boolean).join(':');
    if (!streamMap.has(key)) streamMap.set(key, new Stream(key));
    return streamMap.get(key);
  }

  del(name) {
    const key = [this.id, name].filter(Boolean).join(':');
    if (streamMap.has(key)) streamMap.get(key).abort();
    return streamMap.delete(key);
  }

  pipe(...unitsOfWork) {
    if (this.closed) return throwError(new Error('closed'));
    const action = new Action(this, ...unitsOfWork);
    this.actions.push(action);
    this.subject.next(action);
    return action;
  }

  fork(name, ...unitsOfWork) {
    if (this.closed) return throwError(new Error('closed'));
    const stream = this.get(name);
    const action = new Action(stream, ...unitsOfWork);
    const { exec } = action;
    action.exec = () => {
      if (stream.closed) return action.abort('closed');
      return exec.call(action);
    };
    this.actions.push(action);
    this.subject.next(action);
    return action;
  }

  // repeat(...unitsOfWork) {
  //   const action = this.pipe(...unitsOfWork);

  //   action.subscribe({
  //     error: () => {},
  //     complete: () => { this.repeat(...unitsOfWork); },
  //   });

  //   return action;
  // }

  subscribe(...args) {
    return this.observable.subscribe(...args);
  }

  open() {
    this.closed = false;
    return this;
  }

  close() {
    this.closed = true;
    return this;
  }

  pause() {
    if (!this.paused) this.paused = new Promise((resolve) => { this.play = resolve; }); // eslint-disable-line no-new
    this.actions.forEach(action => action.pause());
    return this;
  }

  resume() {
    if (this.paused) { this.play(); this.paused = false; }
    this.actions.forEach(action => action.resume());
    return this;
  }

  abort(reason = 'abort') {
    // this.subject.next(new AbortStreamError(reason));
    this.actions.splice(0, this.actions.length).forEach(action => action.abort(reason));
    return this;
  }
}
