import data from './config.data';
import models from './config.models';
import listeners from './config.listeners';
import translators from './config.translators';

export default {
  data,
  models,
  listeners,
  translators,
  server: { port: 3003 },
  redis: { name: 'impetus' },
};
