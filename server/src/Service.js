import Dao from './Dao';
import Data from './Data';
import Redis from './Redis';
import Server from './Server';
import conf from '../config';

export const config = Object.entries(conf).reduce((prev, [key, value]) => Object.assign(prev, { [key]: value || {} }), conf);
export const data = new Data(config.data);
export const redis = new Redis(config.redis);
export const $db = new Dao(redis, config.models);
export const $data = new Dao(data, config.models);
export const $server = new Server(config.server);
