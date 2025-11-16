import session from 'express-session';
import {RedisStore} from "connect-redis";
import dotenv from 'dotenv';
import { redisClient } from './redis.js';

dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret';

export const sessionConfig = session({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  name: "connect.id",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
});