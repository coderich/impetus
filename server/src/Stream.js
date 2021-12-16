// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject } from 'rxjs';
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
    this.subject = new Subject();
    this.observable = this.subject.pipe(
      tap((hook) => { if (hook === 'abort') throw new Error(); }),
      concatMap(action => action.exec()),
      retry(),
      publish()
    );
    this.observable.connect();
    this.observable.subscribe({ next: () => this.actions.shift() });
  }

  pipe(...unitsOfWork) {
    const action = new Action(this, ...unitsOfWork);
    this.actions.push(action);
    this.subject.next(action);
    return action;
  }

  repeat(...unitsOfWork) {
    const action = this.pipe(...unitsOfWork);

    const subscription = action.subscribe({
      error: () => {
        subscription.unsubscribe();
      },
      complete: () => {
        subscription.unsubscribe();
        this.repeat(...unitsOfWork);
      },
    });

    return action;
  }

  subscribe(...args) {
    return this.observable.subscribe(...args);
  }

  abort() {
    this.subject.next('abort');
    this.actions.splice(0, this.actions.length).forEach(action => action.abort());
  }
}
