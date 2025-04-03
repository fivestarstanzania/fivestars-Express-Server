import Seller from "../models/sellerModel.js";
import User from "../models/User.js";
import Review from '../models/ReviewsModel.js'

export const getSellerById = async (req, res) => {
  try { 
    const { userId } = req.params; // user ID
    console.log("userId:", userId)

    // Check if the user exists in the User collection
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found in the User database" });
    }

    // Check if a seller exists with the same sellerId as the provided user ID
    const seller = await Seller.findOne({ userId });
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

export const agreeToTerms = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const seller = await Seller.findOne({ userId });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    //console.log("user to agreement  is found")
    if (seller.hasAgreedToTerms) {
      console.log("all correct for new seller")
      return res.status(200).json({ message: "Terms already agreed" });
    }

    // Update seller and user
    seller.hasAgreedToTerms = true;
    seller.termsAgreementDate = new Date();
    seller.activityStatus = "Active";
    await seller.save();

    const user = await User.findById(userId);
    user.role = "seller";
    await user.save();
    //console.log("all correct for new seller")

    res.status(200).json({ message: "Terms agreement confirmed. Seller account activated." });
  } catch (error) {
    res.status(500).json({ message: "Error updating agreement", error: error.message });
  }
};
