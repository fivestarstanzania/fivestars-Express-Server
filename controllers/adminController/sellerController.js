import Seller from "../../models/sellerModel.js";
import User from "../../models/User.js";
import Review from '../../models/ReviewsModel.js'

import multer from "multer";
import storage from "../../utils/cloudinar.js"; 

export const upload = multer({ storage });

export const createSeller = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      description,
      businessName,
    } = req.body;

    // Check if required fields are provided
    if (!businessName || !name || !description || !phone || !email  ) {
      return res.status(400).json({ error: "Please fill in all required fields." });
      
    }

     // Find user by email in the User collection
     const user = await User.findOne({ email });
     if (!user) {
       return res.status(404).json({ message: "User not found in the database." });
     }

     const sellerId = user._id;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Seller with this email already exists." });
    }


    
    user.role = "seller";
    await user.save(); 

    
    const businessAddress = JSON.parse(req.body.businessAddress);
    const newSeller = new Seller({
      sellerId,
      name,
      email,
      phone,
      description,
      businessName,
      businessAddress,
      profileImage: req.file ? req.file.path : null,
    });

    

    const savedSeller = await newSeller.save();
    
    res.status(201).json({ message: "Seller created successfully", data: savedSeller });
  } catch (error) {
    res.status(500).json({ message: "Error creating seller", error: error.message });
  }
};

export const getSellerById = async (req, res) => {
  try { 
    const { id } = req.params; // user ID

    // Check if the user exists in the User collection
    const userExists = await User.findById(id);
    if (!userExists) {
      return res.status(404).json({ message: "User not found in the User database" });
    }

    // Check if a seller exists with the same sellerId as the provided user ID
    const seller = await Seller.findOne({ sellerId: id });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found for the provided user ID" });
    }

    
     const reviews = await Review.find({sellerId: seller._id, reviewType:"Seller"  })
     .populate({ path: "userId", select: "name" }) 
     .exec();;
     
    
    res.status(200).json({ message: "Seller fetched successfully", data: {seller, reviews} });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seller", error: error.message });
  }
};

export const deleteSellerById = async (req, res) => {
  try {
    const { id } = req.params; // Seller ID

    const seller = await Seller.findById(id);
    if (!seller){
      return res.status(404).json({message:"Seller not found"})
    }

    const sellerId = seller.sellerId;

    const user = await User.findById(sellerId);

    if(user){
      user.role = "customer";
      await user.save();
    }else{
      return res.status(404).json({message:"no users for that seller"})
    }

    await Seller.findByIdAndDelete(id);

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting seller", error: error.message });
  }
};

export const getAllSellers = async (req, res) => {
    try {
      const sellers = await Seller.find();
      const totalSellers = await Seller.countDocuments();
      // Respond with both the total number and the products
      res.status(200).json({
        total: totalSellers,
        sellers,
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({message:"error fetching users"});
    }
}