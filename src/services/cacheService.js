import NodeCache from 'node-cache';
import config from '../config/index.js';
import { APP_CONFIG } from '../constants/index.js';

class CacheService {
  constructor() {
    this.redisClient = null;
    this.nodeCache = this.initializeNodeCache();
  }

  initializeNodeCache() {
    const ttlSeconds = config.redis.ttlSeconds || APP_CONFIG.DEFAULT_CACHE_TTL;
    return new NodeCache({ 
      stdTTL: ttlSeconds, 
      checkperiod: ttlSeconds * 0.2 
    });
  }

  async getRedisClient() {
    if (!config.redis.url) return null;
    if (this.redisClient) return this.redisClient;
    
    try {
      const { createClient } = await import('redis');
      this.redisClient = createClient({ url: config.redis.url });
      this.redisClient.on('error', this.handleRedisError);
      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      return null;
    }
  }

  handleRedisError(error) {
    console.error('Redis error:', error);
  }

  async get(key) {
    const redisClient = await this.getRedisClient();
    
    if (redisClient) {
      return this.getFromRedis(redisClient, key);
    }
    
    return this.getFromNodeCache(key);
  }

  async getFromRedis(redisClient, key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  getFromNodeCache(key) {
    return this.nodeCache.get(key) ?? null;
  }

  async set(key, value, ttlSeconds = config.redis.ttlSeconds) {
    const redisClient = await this.getRedisClient();
    
    if (redisClient) {
      return this.setInRedis(redisClient, key, value, ttlSeconds);
    }
    
    return this.setInNodeCache(key, value, ttlSeconds);
  }

  async setInRedis(redisClient, key, value, ttlSeconds) {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.set(key, serializedValue, { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  setInNodeCache(key, value, ttlSeconds) {
    return this.nodeCache.set(key, value, ttlSeconds);
  }

  async clear() {
    if (this.redisClient) {
      await this.redisClient.flushAll();
    }
    this.nodeCache.flushAll();
  }

  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

const cacheService = new CacheService();

export const cacheGet = (key) => cacheService.get(key);
export const cacheSet = (key, value, ttlSeconds) => cacheService.set(key, value, ttlSeconds);
export const cacheClear = () => cacheService.clear();
export const cacheDisconnect = () => cacheService.disconnect();

export default { cacheGet, cacheSet, cacheClear, cacheDisconnect }; 