import session from 'express-session';
import {RedisStore} from "connect-redis";
import dotenv from 'dotenv';
import { redisClient } from './redis.js';

dotenv.config();
 
export const sessionConfig = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  name:"connect.id",
  resave: false,
  saveUninitialized: false,

  cookie: {
    //secure: process.env.NODE_ENV === 'production',
    secure:false, // make true for production  HTTPS-only in production
    httpOnly: true, 
    sameSite: 'strict', // Prevent CSRF
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});
