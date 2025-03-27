
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

dotenv.config();

const PORT=process.env.PORT;


//Middlewares
app.use(json({limit:'50mb'}));
app.use(urlencoded({limit:'50mb', extended:true}))
app.use(cors({
  origin: process.env.CLIENT_URL, // frontend url
  credentials: true, //allow cookies to be sent
}));
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


server.listen(PORT, ()=>{
  console.log(`Example app listening on port ${PORT}`)
  connectDB()
})



