import * as data from './data';
import * as models from './models';
import listeners from './config.listeners';
import translators from './config.translators';

export default {
  data,
  models,
  listeners,
  translators,
  server: { port: 3003 },
  redis: { name: 'impetus', keyDepth: 2 },
};
