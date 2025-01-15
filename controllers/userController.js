import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
const { sign, verify }=jwt;
const { hash, compare } =bcrypt;

//register controller
const userController={
/*
  // Store the FCM token in the database
async saveToken (req, res){
  const { userId, token } = req.body;
  try {
    // Check if user exists, and if so, update their token
    let user = await User.findOne({ userId });
    if (user) {
      user.fcmToken = token;
    } else {
      // Create new user with token if not found
      console.log('no user found in database  to save token')
    }
    await user.save();
    res.status(200).json({ success: true, message: 'Token saved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving token.', error });
  }
},
*/
  async  register(req, res) {
    const { email, name, universityName, phoneNumber, password } = req.body;
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

async verifySellerApplication(req, res){
  try {
    const { userId, status, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.applicationStatus = status; // 'approved' or 'declined'
    if (status === 'approved') user.role = 'seller';
    await user.save();

    res.status(200).json({ message: `Application ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying application' });
  }
},

// Login Controller
async  login(req, res) {
    const { email, password } = req.body;
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
        const accesstoken = sign({ userId: user._id, userEmail: user.email}, process.env.JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = sign({userId: user._id}, process.env.JWT_REFRESH_SECRET, {expiresIn:'7d'});

        res.json({ accesstoken,refreshToken, message: 'Login successful', email: user.email, name: user.name, _id:user._id});
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
        { expiresIn: '1d' }
      );
      if(accessToken){
        console.log("I generated new  access token from refresh token for you")
      }
  
      // Send the new access token to the client
      res.json({ accessToken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error refreshing access token' });
    }
  },

}
export default userController;
 



