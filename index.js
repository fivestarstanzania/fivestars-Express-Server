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
import { authMiddleware } from './middleware/authMiddleware.js';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { app, server } from './socket/socket.js';
import { sessionConfig } from './config/session.js';
import cookieParser from "cookie-parser"
import path from 'path'
import { errorHandler } from './utils/errorHandler.js';

dotenv.config();

const PORT=process.env.PORT;

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
  process.env.REACT_URL, 
  "https://fivestarstanzania.netlify.app"
];

//Middlewares
app.use(json({limit:'50mb'}));
app.use(urlencoded({limit:'50mb', extended:true}))
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  exposedHeaders: ['set-cookie']
}));

app.set('trust proxy', 1); // Required for secure cookies on Render
app.use(sessionConfig)
app.use(cookieParser());


app.use('/api/sameja/admin', adminRoutes)
app.use('/api/products',authMiddleware,  productRouter)
app.use('/api/users',  userRoutes)
app.use('/api/feedback',authMiddleware,  feedbackRoutes)
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use('/api/sellers',authMiddleware, sellerRoutes)
app.use('/api/reviews', authMiddleware,reviewsRoutes)




// Public route (no authentication required)
app.get('/public', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'index.html'));
});

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

server.listen(PORT, ()=>{
  console.log(`Example app listening on port ${PORT}`)
  connectDB()
})



