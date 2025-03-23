
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { RedisStore } from "connect-redis";
import { redisClient } from '../config/redis.js';
import session from 'express-session';
import User from '../models/User.js';

const {  verify, TokenExpiredError } = jwt;

const store = new RedisStore({ client: redisClient });

// Middleware to verify user authentication
export  const authMiddleware =  async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.header('Authorization')?.split(' ')[1]; 
        if (!token) {
            console.log("No token provided from Auth middleware");
            return res.status(401).json({ message: 'No token provided. Access denied.' });
          
        }
        //console.log(token); 
        // Verify token and decode payload
        const decoded = verify(token, process.env.JWT_SECRET);
        if(!decoded){
            console.log("Invalid token from Auth middleware");
            return res.status(403).json({ message: "Invalid token" });
        }
    
        //normalUser = await User.findById(decoded.userId).select('-password'); // Exclude password
        const gUser = await User.findById(decoded.userId);
        if (!gUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        req.user = gUser;
        next(); 
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            console.log("Token expired from catch error");
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error(err);
        res.status(400).json({ message: 'Invalid token' });
    }
};

const extractSessionId = (cookieValue) => {
    if (!cookieValue) return null;
    const parts = cookieValue.split('.');
    if (parts.length < 2) return null; // Invalid format
    return parts[0].substring(2); // Remove "s:" prefix
};


export const requireAdminAuth =   async(req, res, next) => {
    try {
        if (!req.sessionID) {
            console.log(`no user sessionId`);
            return res.json({ message: 'Unauthorized no sessionId' });
        }
        console.log(`user sessionId`, req.sessionID );

        if (!req.session || !req.session.user) {
            return res.status(401).json({  message: 'Unauthorized' });
        } 
        console.log(`user session`, req.session.user );

        //after that is extra
        const admin = await Admin.findById(req.session.user.id);
        if (!admin) {
            req.session.destroy();
            console.log(`no that admin`);
            return res.json({ isAuthenticated: false });
        }

        const rawCookie = req.cookies['connect.id'];
        const sessionId = extractSessionId(rawCookie);
        if (!sessionId) {
            return res.status(401).json({ error: "Invalid session format" });
        }

        store.get(sessionId, (err,session) =>{
            if(err){
                console.error("Redis error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            if (!session) {
                return res.status(401).json({ error: "Session expired or invalid" });
            }
            console.log("Valid session:", session);

        })

        if (!req.cookies['connect.id']) {
            return res.status(401).json({ message: 'Unauthorized: Missing session cookie' });
        }
        console.log('Cookies:', req.cookies);
        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Auth check failed', error: error.message });
    }
};


// Middleware to check if user is an admin
export const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};


// Middleware to check if user is a seller
export const checkSeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Access denied. Sellers only.' });
    }
    next();
};



