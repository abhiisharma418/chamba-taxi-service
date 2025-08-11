import Redis from 'ioredis';

let redisClient;

export const getRedis = () => {
  if (!redisClient) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(url, { maxRetriesPerRequest: 3 });
  }
  return redisClient;
};