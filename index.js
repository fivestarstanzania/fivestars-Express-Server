import  { json, urlencoded } from 'express';
import cors from 'cors';
import productRouter from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from "./routes/notificationRoutes.js";
import sellerRoutes from './routes/sellerRoutes.js'
import reviewsRoutes from './routes/reviewsRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import LikedProductsRoutes from "./routes/likedProductsRoutes.js"
import Wishlist from "./routes/wishlistRoutes.js"

import { authMiddleware } from './middleware/authMiddleware.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { app, server } from './socket/socket.js';
import { sessionConfig } from './config/session.js';
import { redisClient } from './config/redis.js';
import cookieParser from "cookie-parser"
import path from 'path'
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const PORT=process.env.PORT||10000 ;

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
  process.env.REACT_URL, 
].filter(Boolean);


// Basic health check endpoint - CRITICAL for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'backend'
  });
});

// Public route (no authentication required)
app.get('/public', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'index.html'));
});
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'privacy-policy.html'));
});

//Middlewares
app.use(json({limit:'50mb'}));
app.use(urlencoded({limit:'50mb', extended:true}))

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept"
  ],
  exposedHeaders: ["set-cookie", "Content-Disposition"],
  maxAge: 86400
  
}));
app.options('*', cors());

app.set('trust proxy', 1); // Required for secure cookies on Render
app.use(cookieParser());

// We'll register routes after Redis/session is applied — helper function
const registerRoutes = () => {
// All routes that depend on session should be registered here
app.use('/api/sameja/admin', adminRoutes);
app.use('/api/products', authMiddleware, productRouter);
app.use('/api/users', userRoutes);
app.use('/api/feedback', authMiddleware, feedbackRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/sellers', authMiddleware, sellerRoutes);
app.use('/api/reviews', authMiddleware, reviewsRoutes);
app.use('/api/liked-products', authMiddleware, LikedProductsRoutes);
app.use('/api/wishlist', authMiddleware, Wishlist);


app.get('/delete', (req, res) => {
res.sendFile(path.join(path.resolve(), 'delete.html'));
});


// 404 handler — after routes
app.use((req, res, next) => {
res.status(404).json({ status: 'error', message: `Can't find ${req.originalUrl} on this server!` });
});


// Global error handler
app.use(errorHandler);
};


// === START SERVER ONLY AFTER DB + REDIS ===
const startServer = async () => {
  try {
    // 1. Connect to MongoDB (connectDB() already logs success)
    await connectDB();

    // 2. Redis auto-connects when created, but wait for 'ready' event
    // ioredis connects automatically, no need to call .connect()
    await new Promise((resolve, reject) => {
      if (redisClient.status === 'ready') {
        console.log('Redis already connected');
        resolve();
      } else {
        redisClient.once('ready', () => {
          console.log('Redis connected');
          resolve();
        });
        redisClient.once('error', (err) => {
          reject(err);
        });
        // Set timeout to avoid waiting forever
        setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 10000);
      }
    });

    // 3. Apply session *after* Redis is ready
    app.use(sessionConfig);

    registerRoutes();

    // 4. Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Only exit on startup failure
  }
};

startServer();


// === Graceful Error Handling (DO NOT EXIT) ===
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  // Let Render restart
});


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Let Render restart
});



