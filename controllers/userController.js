import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const { sign, verify, TokenExpiredError }=jwt;
const { hash, compare } =bcrypt;


const userController={
  async  register(req, res) {
    const { email, name, universityName, phoneNumber, password} = req.body;
    
    try {
        // Check if user already exists
        const user =  await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (user) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email or phone number is already in use.',
              });
        }
        // Hash the password
        const hashedPassword = await hash(password, 10);
        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            universityName,
            phoneNumber,
            role: 'customer',
        });
        // Save the user in the database
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully from server' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }

},

// Login Controller
async  login(req, res) {
  //console.log("login controller called")
    const { email, password} = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials: User not found' });
        }
        // Verify the password
        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials: password does not match' });
        }
        
        // Generate a JWT token
        const accessToken = sign({ userId: user._id, userEmail: user.email}, process.env.JWT_SECRET, { expiresIn: '15m' });
        
        const refreshToken = sign({userId: user._id}, process.env.JWT_REFRESH_SECRET, {expiresIn:'7d'});

        //console.log("login controller ended refresh and access tokens:", refreshToken,accessToken)
        res.json({ accessToken,refreshToken, message: 'Login successful', email: user.email, name: user.name, _id:user._id});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
},


async logout(req,res){
  try {
    //res.cookie("jwt", "", {maxAge:0});
    res.status(200).json({message:"Logged out successfully"});

  } catch (error) {
    console.log("Error in logout controller", error.message)
    res.status(500).json({message:"Internal server error"});
  }
},

async checkAuth(req,res){
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message)
    res.status(500).json({message:"Internal server error"});
  }
},

// Refresh token controller to generate a new access token
async refreshToken(req, res) {
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
        console.log("i got coded for refresh access token")
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
  },
async updateExpoToken(req,res){
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
}
export default userController;
 



