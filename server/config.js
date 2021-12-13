import data from './config.data';
import models from './config.models';
import eventBus from './config.eventBus';
import eventListeners from './config.eventListeners';

export default {
  data,
  models,
  eventBus,
  eventListeners,
  server: { port: 3003 },
  redis: { name: 'impetus' },
};
