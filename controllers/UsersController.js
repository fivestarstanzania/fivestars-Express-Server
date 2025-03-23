import { OAuth2Client } from "google-auth-library"
import dotenv from 'dotenv';
import User from "../models/User.js"
import jwt from 'jsonwebtoken';
import Blacklist from "../models/BlacklistModel.js";

const { sign, verify, TokenExpiredError }=jwt;
dotenv.config();
  

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export const registerUsers =  async (req,res)=>{
    console.log("i got called")
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

export const checkAuth = async (req,res)=>{
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message)
    res.status(500).json({message:"Internal server error"});
  }
}

export const logout = async (req,res) => {
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
  console.log("refresh Token controller called")
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      console.log('Refresh token is required')
      return res.status(401).json({ message: 'Refresh token is required' });
    }
  
    try {
      // Verify the refresh token
      const decoded = verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      if(decoded){
        console.log("i got called for refresh access token")
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
        console.log("expired refresh token ")
        return res.status(403).json({ message: 'Refresh token expired. Please log in again.' });
      }
      res.status(500).json({ message: 'Error refreshing access token' });
    }
}


export const  updateExpoToken = async(req,res) =>{
  console.log("i got called to update expo push token");
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
