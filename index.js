
import  { json, urlencoded } from 'express';
import cors from 'cors';
import productRouter from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import messageRoute from './routes/messageRoute.js'
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from "./routes/notificationRoutes.js";
import sellerRoutes from './routes/sellerRoutes.js'
import reviewsRoutes from './routes/reviewsRoutes.js'

import { authMiddleware, checkAdmin, checkSeller } from './middleware/authMiddleware.js';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import { app, server } from './socket/socket.js';

dotenv.config();


const port =3000
const PORT=process.env.PORT;


//Middlewares
app.use(json({limit:'50mb'}));
app.use(urlencoded({limit:'50mb', extended:true}))
app.use(cors());


app.use('/api/products', authMiddleware, productRouter)
app.use('/api/users',  userRoutes)
app.use('/api/feedback', authMiddleware, feedbackRoutes)
app.use('/api/messages', authMiddleware, messageRoute)
app.use("/api/orders", authMiddleware,  orderRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use('/api/sellers', sellerRoutes)
app.use('/api/reviews', reviewsRoutes)



// Public route (no authentication required)
app.get('/public', (req, res) => {
  res.send('This is a public route, accessible to everyone!');
});

// Protected route (requires authentication)
app.get('/protected', authMiddleware, (req, res) => {
  res.send(`Welcome! You are authenticated as user ID: ${req.user.id}`);
});


server.listen(PORT || port, ()=>{
  console.log(`Example app listening on port ${PORT}`)
  connectDB()
})



