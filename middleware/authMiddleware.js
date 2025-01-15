//JWT authentication middleware
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
const { verify } = jwt;


// Middleware to verify user authentication
export  const authMiddleware =  async (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = req.header('Authorization')?.split(' ')[1]; // Bearer <token>
        if (!token) {
            console.log("No token provided from Auth middleware"); // Debugging
            return res.status(401).json({ message: 'No token provided. Access denied.' });
          
        }
        //console.log(token); // Debugging
    // Verify token and decode payload
    const decoded = verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.userId).select('-password'); // Exclude password

    if (!req.user) {
        return res.status(404).json({ message: 'User not found.' });
      }
        next(); // Call the next middleware or route handler
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid token' });
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



//export default { authMiddleware, checkAdmin, checkSeller };

