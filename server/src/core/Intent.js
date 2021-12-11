/**
 * Intent
 *
 * Responsible for checks and ultimately create an Action or throw an error.
 */
export default class Intent {
  constructor(config) {
    this.config = config;
  }
}

class IntentError extends Error {

}
