import NodeCache from 'node-cache';
import config from '../config/index.js';

let redisClient = null;
let nodeCache = new NodeCache({ stdTTL: config.redis.ttlSeconds, checkperiod: config.redis.ttlSeconds * 0.2 });

async function getRedis() {
  if (!config.redis.url) return null;
  if (redisClient) return redisClient;
  const { createClient } = await import('redis');
  redisClient = createClient({ url: config.redis.url });
  redisClient.on('error', (err) => console.error('Redis error', err));
  await redisClient.connect();
  return redisClient;
}

export async function cacheGet(key) {
  const r = await getRedis();
  if (r) {
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  }
  return nodeCache.get(key) ?? null;
}

export async function cacheSet(key, value, ttlSeconds = config.redis.ttlSeconds) {
  const r = await getRedis();
  const str = JSON.stringify(value);
  if (r) {
    await r.set(key, str, { EX: ttlSeconds });
    return true;
  }
  return nodeCache.set(key, value, ttlSeconds);
}

export default { cacheGet, cacheSet }; 