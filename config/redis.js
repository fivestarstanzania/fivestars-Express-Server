import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();


// Support REDIS_URL for platforms like Render/Heroku or individual host/port
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
});

redisClient.on('connect', () => console.log('Redis: connecting...'));
redisClient.on('ready', () => console.log('Redis: ready'));
redisClient.on('error', (err) => console.error('Redis error', err));



redisClient.on('close', () => {
  console.log('Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});





