import Seller from "../../models/sellerModel.js";
import User from "../../models/User.js";
import Review from '../../models/ReviewsModel.js'
import Product from "../../models/ProductModel.js";

import multer from "multer";
import {sellerStorage, cloudinary} from "../../utils/cloudinary.js"; 

export const upload = multer({ storage:sellerStorage });

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
      console.log("Please fill in all required fields.");
      return res.status(400).json({ error: "Please fill in all required fields." });
      
    }
    console.log("check 1")

     // Find user by email in the User collection
     const user = await User.findOne({ email });
     if (!user) {
      console.log("User not found in the database.")
       return res.status(404).json({ message: "User not found in the database." });
     }

     const userId = user._id;
     console.log("check 2")
    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      console.log("Seller with this email already exists.")
      return res.status(400).json({ message: "Seller with this email already exists." });
    }


    
    user.role = "seller";
    await user.save(); 

    console.log("check 3")
    
    const businessAddress = JSON.parse(req.body.businessAddress);
    const newSeller = new Seller({
      userId,
      name,
      email,
      phone,
      description,
      businessName,
      businessAddress,
      profileImage: req.file ? req.file.path : null,
    });

    console.log("check 4")

    const savedSeller = await newSeller.save();
    console.log("check 5")
    res.status(201).json({ message: "Seller created successfully", data: savedSeller });
  } catch (error) {
    res.status(500).json({ message: "Error creating seller", error: error.message });
    console.log(error)
  }
};

export const getSellerById = async (req, res) => {
  try { 
    const { id } = req.params; // user ID

    // Check if the user exists in the User collection
    const sellerExists = await Seller.findById(id);
    if (!sellerExists) {
      return res.status(404).json({ message: "User not found in the User database" });
    }

    res.status(200).json({ message: "Seller fetched successfully", data: sellerExists });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seller", error: error.message });
  }
};

export const updateUploadLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { uploadLimit } = req.body;

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.uploadLimit = uploadLimit;
    await seller.save();

    res.status(200).json({ message: "Upload limit updated successfully", data: seller });
  } catch (error) {
    res.status(500).json({ message: "Error updating upload limit", error: error.message });
  }
};

export const deleteSellerById = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if(!sellerId){
      return res.status(400).json({ error: "Seller Id is required." });
    }
    console.log(sellerId)

    // 1. Find the seller first to get their userId
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // 2. Delete all products associated with this seller
    await Product.deleteMany({ sellerId: sellerId });

    // 3. Delete the seller
    await Seller.findByIdAndDelete(sellerId);

    // 4. Update the user's role back to customer
    const user = await User.findById(seller.userId);
    if (user) {
      user.role = "customer";
      await user.save();
    }

    // 5. Delete the seller's profile image from Cloudinary if exists
    if (seller.profileImage) {
      const publicId = seller.profileImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ 
      message: "Seller and all their products have been deleted successfully" 
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting seller and products", 
      error: error.message 
    });
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

export const banSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 1. Find and update the seller's activityStatus to "Banned"
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { activityStatus: "Banned" },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // 2. Update all products from this seller to have sellerStatus "Banned"
    await Product.updateMany(
      { sellerId: sellerId },
      { sellerStatus: "Banned" }
    );

    // 3. Optional: Update the user's role if needed
    const user = await User.findById(seller.userId);
    if (user) {
      user.role = "banned-seller"; // Or whatever role you want
      await user.save();
    }

    res.status(200).json({ 
      message: "Seller and their products have been banned successfully",
      data: seller
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error banning seller", 
      error: error.message 
    });
  }
};