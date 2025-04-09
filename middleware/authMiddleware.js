import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { RedisStore } from "connect-redis";
import { redisClient } from '../config/redis.js';
import User from '../models/User.js';
import { AppError } from '../utils/errorHandler.js';

const { verify, TokenExpiredError } = jwt;

const store = new RedisStore({ client: redisClient });

// Middleware to verify user authentication
export const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.header('Authorization')?.split(' ')[1]; 
        if (!token) {
            throw new AppError('No token provided. Access denied.', 401);
        }

        // Verify token and decode payload
        const decoded = verify(token, process.env.JWT_SECRET);
        if(!decoded){
            throw new AppError('Invalid token', 403);
        }
    
        const gUser = await User.findById(decoded.userId);
        if (!gUser) {
            throw new AppError('User not found.', 404);
        }
        req.user = gUser;
        next(); 
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            next(new AppError('Token expired', 401));
            return;
        }
        if (err instanceof AppError) {
            next(err);
            return;
        }
        next(new AppError('Invalid token', 400));
    }
};

const extractSessionId = (cookieValue) => {
    if (!cookieValue) return null;
    const parts = cookieValue.split('.');
    if (parts.length < 2) return null; // Invalid format
    return parts[0].substring(2); // Remove "s:" prefix
};

export const requireAdminAuth = async(req, res, next) => {
    try {  
        if (!req.session || !req.session.user) {
            throw new AppError('Unauthorized', 401);
        } 
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware to check if user is an admin
export const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        next(new AppError('Access denied. Admins only.', 403));
        return;
    }
    next();
};

// Middleware to check if user is a seller
export const checkSeller = (req, res, next) => {
    if (req.user.role !== 'seller') {
        next(new AppError('Access denied. Sellers only.', 403));
        return;
    }
    next();
};



