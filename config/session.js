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
    secure:false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  }
});

/*
secret: process.env.SESSION_SECRET,
resave: false,
saveUninitialized: false,
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 4 * 60 * 60 * 1000,
},
name: 'session.id', // Explicit cookie name
unset: 'destroy' // Proper session deletion

*/