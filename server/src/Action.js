// https://blog.angular-university.io/rxjs-higher-order-mapping/

import { Subject } from 'rxjs';
import { tap, concatMap, publish } from 'rxjs/operators';

export default class Action {
  constructor(stream, ...unitsOfWork) {
    this.params = { $stream: stream, $action: this };
    this.unitsOfWork = unitsOfWork;
    this.subject = new Subject();
    this.observable = this.subject.pipe(
      tap(hook => (hook === 'abort' ? this.subject.error() : hook)),
      concatMap((action) => {
        return Promise.resolve(action(this.params)).then((result = this.params) => {
          this.params = Object.assign({ $stream: stream, $action: this }, result);
          if (!this.unitsOfWork.shift() || !this.unitsOfWork.length) this.subject.complete();
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
      this.unitsOfWork.forEach(action => this.subject.next(action));
    });
  }

  subscribe(...args) {
    return this.observable.subscribe(...args);
  }

  abort() {
    this.subject.next('abort');
  }
}
