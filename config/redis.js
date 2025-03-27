import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();


export const redisClient = new Redis (process.env.REDIS_URL);
 
redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("Redis Connection Error:", err);
});



