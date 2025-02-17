import Redis from 'ioredis';


const redisURL = 'redis://localhost:6379';

export const redisClient = new Redis ({url: redisURL });

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("Redis Connection Error:", err);
});



