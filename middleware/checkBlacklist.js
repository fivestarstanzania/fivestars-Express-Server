import Blacklist from "../models/BlacklistModel.js";

export  const  checkBlacklist = async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Token is required' });
    }
    try {
      // Check if the token is blacklisted
      const blacklistedToken = await Blacklist.findOne({ refreshToken });
      if (blacklistedToken) {
        return res.status(403).json({ message: 'Token is blacklisted' });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error checking blacklist', error: error.message });
    }
  };