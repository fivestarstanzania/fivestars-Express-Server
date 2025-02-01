import Review from '../models/ReviewsModel.js'
import Product from "../models/ProductModel.js";
import User from "../models/User.js"; 
import Seller from "../models/sellerModel.js"; 

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { reviewType, productId, sellerUserId, userId, rating, reviewText } =
      req.body;

     // Check if reviewType is valid (must be "Product" or "Seller")
     if (reviewType !== "Product" && reviewType !== "Seller") {
        return res.status(400).json({ message: "Invalid review type. Must be 'Product' or 'Seller'." });
      }

    // Validate required fields
    if (reviewType === "Product" && !productId) {
      return res
        .status(400)
        .json({ message: "productId is required for product reviews" });
    }
    if (reviewType === "Seller" && !sellerUserId) {
      return res
        .status(400)
        .json({ message: "sellerId is required for seller reviews" });
    }

    // Check if userId exists in the Users collection
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found. Please provide a valid userId." });
    }

    // Check if productId exists in the Products collection (for Product reviews)
    if (reviewType === "Product") {
      const productExists = await Product.findById(productId);
      if (!productExists) {
        return res
          .status(404)
          .json({ message: "Product not found. Please provide a valid productId." });
      }
    }

    // Check if sellerId exists in the Users collection (for Seller reviews)
    if (reviewType === "Seller") {
      const sellerExists = await User.findById(sellerUserId);
      if (!sellerExists) {
        return res
          .status(404)
          .json({ message: "Seller not found. Please provide a valid sellerId." });
      }
    }

    const seller = await Seller.findOne({sellerId:sellerUserId})

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    // Create the review
    const review = new Review({
      reviewType,
      productId: reviewType === "Product" ? productId : null, 
      sellerId: reviewType === "Seller" ? seller._id : null, 
      userId,
      rating,
      reviewText,
    });

    await review.save();
    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating review", error });
  }
};


// Retrieve all reviews for a product or seller
export const getReviews = async (req, res) => {
  try {
    const { reviewType, id } = req.params;
    if (reviewType !== "Product" && reviewType !== "Seller") {
        return res.status(400).json({ message: "Invalid review type. Must be 'Product' or 'Seller'." });
    }
    const seller = reviewType === "Seller" ? await Seller.findOne({sellerId:id}): null
    const query = reviewType === "Product" ? { productId: id } : { sellerId: seller._id };
    const reviews = await Review.find({ reviewType, ...query })
      .populate("userId", "name") 
    res.status(200).json({ reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving reviews", error });
  }
};
