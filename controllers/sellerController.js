import Seller from "../models/sellerModel.js";
import User from "../models/User.js";
import Review from '../models/ReviewsModel.js'

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


