import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();


const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL is missing in environment");
}

export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  reconnectOnError: (err) => {
    const targetErrors = ['ECONNREFUSED', 'ETIMEDOUT'];
    return targetErrors.some(e => err.message.includes(e));
  },
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis ready for commands');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redisClient.on('close', () => {
  console.log('Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});





