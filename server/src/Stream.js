// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject, throwError } from 'rxjs';
import { tap, concatMap, retry, publish } from 'rxjs/operators';
import Action from './Action';

/**
 * Stream
 *
 * Part of the Flow->Stream->Action framework to enable more timing/control over asynchronous events.
 */
export default class Stream {
  constructor() {
    this.actions = [];
    this.closed = false;
    this.paused = false;
    this.subject = new Subject();

    this.observable = this.subject.pipe(
      tap((action) => {
        if (action instanceof Error) throw action;
      }),
      concatMap(async (action) => {
        if (this.paused) await this.paused;
        return action.exec().finally(() => this.actions.shift());
      }),
      retry(),
      publish()
    );

    this.observable.connect();
  }

  pipe(...unitsOfWork) {
    if (this.closed) return throwError('closed');
    const action = new Action(this, ...unitsOfWork);
    this.actions.push(action);
    this.subject.next(action);
    return action;
  }

  repeat(...unitsOfWork) {
    const action = this.pipe(...unitsOfWork);

    action.subscribe({
      error: () => {},
      complete: () => { this.repeat(...unitsOfWork); },
    });

    return action;
  }

  subscribe(...args) {
    return this.observable.subscribe(...args);
  }

  open() {
    this.closed = false;
  }

  close() {
    this.closed = true;
  }

  pause() {
    if (!this.paused) this.paused = new Promise((resolve) => { this.play = resolve; }); // eslint-disable-line no-new
    this.actions.forEach(action => action.pause());
  }

  resume() {
    if (this.paused) { this.play(); this.paused = false; }
    this.actions.forEach(action => action.resume());
  }

  abort(reason) {
    this.subject.next(new Error(reason));
    this.actions.splice(0, this.actions.length).forEach(action => action.abort(reason));
  }
}
