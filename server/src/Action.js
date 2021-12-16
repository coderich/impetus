import { Subject } from 'rxjs';
import { tap, concatMap, publish } from 'rxjs/operators';

/**
 * Action
 *
 * Part of the Flow->Stream->Action framework to enable more timing/control over asynchronous events.
 *
 * Responsible for executing a single action that's broken down into units of work; allowing
 * an action to be aborted before it's completion.
 *
 * @ref https://blog.angular-university.io/rxjs-higher-order-mapping/
 */
export default class Action {
  constructor(stream, ...unitsOfWork) {
    this.subject = new Subject();
    this.unitsOfWork = unitsOfWork;
    this.params = { $stream: stream, $action: this };

    this.observable = this.subject.pipe(
      tap(hook => (hook === 'abort' ? this.subject.error() : hook)),
      concatMap((worker) => {
        return Promise.resolve(worker(this.params)).then((result = this.params) => {
          this.params = Object.assign({ $stream: stream, $action: this }, result);
          if (!unitsOfWork.shift() || !unitsOfWork.length) this.subject.complete();
          return result;
        });
      }),
      publish(),
    );

    this.observable.connect();
  }

  exec() {
    return new Promise((resolve, reject) => {
      this.subscribe({ error: e => reject(e), complete: () => resolve(this.params) });
      this.unitsOfWork.forEach(worker => this.subject.next(worker));
    });
  }

  subscribe(...args) {
    return this.observable.subscribe(...args);
  }

  abort() {
    this.subject.next('abort');
  }
}
