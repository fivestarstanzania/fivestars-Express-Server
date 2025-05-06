import { OAuth2Client } from "google-auth-library"
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from "../models/User.js"
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import Review from '../models/ReviewsModel.js';
import Seller from '../models/sellerModel.js';
import SellerApplication from '../models/SellerApplication.js';
import Notification from '../models/notificationModel.js';
import Feedback from '../models/feedbackModel.js';
import jwt from 'jsonwebtoken';
import Blacklist from "../models/BlacklistModel.js";
import { verifyAppleToken } from "../services/appleAuthServices.js";

const { sign, verify, TokenExpiredError }=jwt;
dotenv.config();
  

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export const registerGoogleUsers =  async (req,res)=>{
    console.log("google login  got called")
    try {
        
        const {token} = req.body;

        //verify google token 
        const ticket = await client.verifyIdToken({
            idToken:token,
            audience:CLIENT_ID,
        });

        const payload = ticket.getPayload();
        //const { sub: googleId, name, email } = payload;
        const { sub: googleId, name, email } = payload;

        //console.log(picture,locale, given_name,family_name)
        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
              googleId,
              name,
              email,
              authMethod: 'google',
              role: 'customer',
            });
            await user.save();
        }
        const accessToken = jwt.sign({ userId: user._id, userEmail: user.email}, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        const refreshToken = jwt.sign({userId: user._id}, process.env.JWT_REFRESH_SECRET,{expiresIn:'7d'});
    
        res.json({ accessToken,refreshToken, message: 'Login successful', email: user.email, name: user.name, _id:user._id});
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ message: 'Authentication failed' });
    }
}
export const registerAppleUsers =  async (req,res)=>{
  //console.log("Apple login  got called")
  try {
    const { identityToken, nonce, userData } = req.body;
    //console.log("identityToken,nonce,user", identityToken, nonce, userData);

    if (!identityToken || !nonce) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    const decoded = await verifyAppleToken(identityToken, nonce);
    const appleId = decoded.sub;
    const email = decoded?.email || userData.email;
    
    //console.log("decoded,appleId,email", decoded, appleId, email);

/*
    if (!email) {
      return res.status(400).json({ message: 'No email provided' });
    }

*/
    // Find or create user
    let user = await User.findOne({ appleId });

    if (!user) {
      user = new User({
        appleId,
        email,
        name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : email.split('@')[0],
        role: 'customer',
        authMethod: 'apple',
      });
      await user.save();
    }

      const accessToken = jwt.sign({ userId: user._id, userEmail: user.email}, process.env.JWT_SECRET, { expiresIn: '15m' });
      
      const refreshToken = jwt.sign({userId: user._id}, process.env.JWT_REFRESH_SECRET,{expiresIn:'7d'});
  
      res.json({ accessToken,refreshToken, message: 'Login successful', email: user.email, name: user.name, _id:user._id});
  } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Authentication failed' });
  }
}
export const checkAuth = async (req,res)=>{
  try {
    res.status(200).json(req.user);
  } catch (error) {
    //console.log("Error in checkAuth controller", error.message)
    res.status(500).json({message:"Internal server error"});
  }
}
export const logout = async (req,res) => {
  //console.log('log out functions')
  const refreshToken = req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(400).json({message:'Refresh token required'});
  }
  try {
    const blacklistedToken = new Blacklist({ token: refreshToken });
    await blacklistedToken.save();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
}
// Refresh token controller to generate a new access token
export const  refreshToken= async(req, res)=> {
  //console.log("refresh Token controller called")
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      //console.log('Refresh token is required')
      return res.status(401).json({ message: 'Refresh token is required' });
    }
  
    try {
      // Verify the refresh token
      const decoded = verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if(decoded){
        //console.log("i got called for refresh access token")
      }
     
      // Generate a new access token
      const accessToken = sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        //console.log("expired refresh token ")
        return res.status(403).json({ message: 'Refresh token expired. Please log in again.' });
      }
      res.status(500).json({ message: 'Error refreshing access token' });
    }
}
export const  updateExpoToken = async(req,res) =>{
  //console.log("i got called to update expo push token");
  try {
    const {expoPushToken} = req.body;
    if(!expoPushToken){
      return res.status(400).json({ message: 'Expo push token is required' });
    }

    // Find user and update token
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { expoPushToken } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Expo push token updated successfully',
      expoPushToken: user.expoPushToken
    });
  } catch (error) {
    console.error('Error updating Expo push token:', error);
    res.status(500).json({ message: 'Server error' });
  }
}























export const deleteUserAccount = async (req, res) => {
  console.log("i want to delete data")
  try {
    const userId = req.user._id; 
    console.log("user id want to delete account", userId)

    
    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Delete or anonymize orders
      await Order.updateMany(
        { 'buyer.id': userId },
        { 
          $set: { 
            'buyer.name': 'Deleted User',
            'buyer.contact': '',
            'buyer.address': '' 
          } 
        },
        { session }
      );
      
      // 2. Delete seller-related data if user is a seller
      const seller = await Seller.findOne({ userId }).session(session);
      if (seller) {
        // Anonymize products
        await Product.updateMany(
          { sellerId: seller._id },
          { 
            $set: { 
              userId: null, // Remove reference
              title: 'Deleted Product',
              description: 'This product has been removed',
              imageUrls: [], // Remove images
              specifications: {} 
            } 
          },
          { session }
        );
        
        // Delete seller record
        await Seller.deleteOne({ _id: seller._id }).session(session);
      }
      
      // 3. Delete seller application if exists
      await SellerApplication.deleteOne({ userId }).session(session);
      
      // 4. Delete reviews
      await Review.deleteMany({ userId }).session(session);
      
      // 5. Delete notifications
      await Notification.deleteMany({ receiverId: userId }).session(session);
      
      // 6. Delete feedback
      await Feedback.deleteMany({ email: req.user.email }).session(session);
      
      // 7. Finally delete the user
      await User.deleteOne({ _id: userId }).session(session);
      
      // Commit transaction if all operations succeed
      await session.commitTransaction();
      
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to delete account',
      error: error.message 
    });
  }
};