//handle login register and auth
import bcryptjs from "bcryptjs";
import Admin from '../models/Admin.js';
import { redisClient } from "../config/redis.js";
const { hash, compare } =bcryptjs;

export const signup = async (req, res) => {
    
  try {
    const { name, password } = req.body;
    // Check if admin exists
    const existingAdmin = await Admin.findOne({ name });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await hash(password, 10);
    
    // Create new admin
    const admin = new Admin({ name,  password:hashedPassword });
    await admin.save();
    res.status(201).json({
      message: 'Admin created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    const admin = await Admin.findOne({ name });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Regenerate session ID on successful login to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Session regeneration failed" });
      }

      req.session.user = {
         id: admin._id, 
         name: admin.name, 
      };

      console.log("successfully logged in:" )
      
      res.json({
        message: 'Login successful',
        user: req.session.user,
      });
        
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = (req, res) => {
  //console.log("Session before destruction :", req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ message: 'Logout failed' });
    }  
    res.clearCookie('connect.id', { 
      path: '/',
      httpOnly: true,
      sameSite:'strict',
      secure: process.env.NODE_ENV === 'production',
     });
    //console.log("Session after destruction :", req.sessionID);
    res.json({ message: 'Logout successful' });
  });
};

export const checkAuth = (req, res) => {
  if (req.session.user) {
    res.json({ isAuthenticated: true, user: req.session.user });
    console.log("is authenticated", req.session.user)
  } else {
    res.json({ isAuthenticated: false });
    console.log("not authenticated")
  }
};