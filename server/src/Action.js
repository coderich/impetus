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
    this.paused = false;
    this.subject = new Subject();
    this.unitsOfWork = unitsOfWork;
    this.params = { $stream: stream, $action: this };

    this.observable = this.subject.pipe(
      tap((hook) => {
        if (hook === 'abort') {
          this.subject.error();
        }
      }),
      concatMap(async (worker) => {
        if (this.paused) await this.paused;
        const result = await Promise.resolve(worker(this.params)).then((value = this.params) => value);
        this.params = Object.assign({ $stream: stream, $action: this }, result);
        if (!unitsOfWork.shift() || !unitsOfWork.length) this.subject.complete();
        return result;
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

  pause() {
    if (!this.paused) this.paused = new Promise((resolve) => { this.play = resolve; }); // eslint-disable-line no-new
  }

  resume() {
    if (this.paused) { this.play(); this.paused = false; }
  }

  abort() {
    this.subject.next('abort');
  }
}
