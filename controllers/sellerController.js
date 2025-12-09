import Seller from "../models/sellerModel.js";
import User from "../models/User.js";
import Review from '../models/ReviewsModel.js'
import SellerApplication from "../models/SellerApplication.js"
import  {cloudinary}  from '../utils/cloudinary.js';
import Product from '../models/ProductModel.js';

export const getSellerById = async (req, res) => {
  try { 
    const { userId } = req.params; // user ID

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
      //console.log("all correct for new seller")
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

// Submit application
export const submitApplication = async (req, res) => {
  try {
      const { _id, email, name } = req.user;
      const userId = _id;
      const {
        phone,
        description,
        businessName,
        businessAddress,
        profileImage
      } = req.body;
      //console.log("image", profileImage)
      if (!businessName || !name || !description || !phone || !email || !businessAddress || !profileImage ) {
        //console.log("Please fill in all required fields.");
        return res.status(400).json({ error: "Please fill in all required fields." });
        
      }

      // Check if user already has a pending application
      const existingApplication = await SellerApplication.findOne({ 
          userId, 
          status: 'pending' 
      });
      //console.log("debug 1")
      if (existingApplication) {
          return res.status(400).json({ 
              message: 'You already have a pending application' 
          });
      }
      //console.log("debug 2")

      const result = await cloudinary.uploader.upload(profileImage, {
        folder:'sellers',
        quality: 'auto',
        fetch_format: 'auto',
        width: 800, // Max width for mobile
        crop: 'limit',
        format: 'webp' // Modern format
      });
      // Create new application
      const application = new SellerApplication({
          userId,
          email,
          name,
          phone,
          description,
          businessAddress,
          businessName,
          profileImage: result.secure_url,
      });
      //console.log("debug 3")
      await application.save();
      
      // Update user's sellerApplication status
      await User.findByIdAndUpdate(userId, {
          'sellerApplication.status': 'pending'
      });
      //console.log("debug 4")
      res.status(201).json(application);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// Get user's application status
export const getMyApplication = async (req, res) => {
  try {
      const { userId } = req.user;
      
      const application = await SellerApplication.findOne({ userId })
          .sort({ submittedAt: -1 })
          .limit(1);
          
      res.json(application || { status: 'not-applied' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};


// Get top sellers with most products (for home screen)
export const getTopSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Aggregate to get sellers with most products
    const topSellers = await Product.aggregate([
      {
        $match: {
          sellerStatus: "Active"
        }
      },
      {
        $group: {
          _id: "$sellerId",
          productCount: { $sum: 1 }
        }
      },
      {
        $sort: { productCount: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo"
        }
      },
      {
        $unwind: "$sellerInfo"
      },
      {
        $match: {
          "sellerInfo.activityStatus": "Active"
        }
      },
      {
        $project: {
          _id: "$sellerInfo._id",
          sellerUserId: "$sellerInfo.userId",
          name: "$sellerInfo.name",
          businessName: "$sellerInfo.businessName",
          profileImage: "$sellerInfo.profileImage",
          description: "$sellerInfo.description",
          productCount: 1,
          activityStatus: "$sellerInfo.activityStatus"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: topSellers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all sellers sorted by product count (for "See All" screen)
export const getAllSellersSortedByProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get total count
    const totalSellers = await Seller.countDocuments({ activityStatus: "Active" });

    // Get sellers with product count
    const sellers = await Seller.aggregate([
      {
        $match: { activityStatus: "Active" }
      },
      {
        $lookup: {
          from: "products",
          let: { sellerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sellerId", "$$sellerId"] },
                    { $eq: ["$sellerStatus", "Active"] }
                  ]
                }
              }
            }
          ],
          as: "products"
        }
      },
      {
        $addFields: {
          productCount: { $size: "$products" }
        }
      },
      {
        $sort: { productCount: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          businessName: 1,
          profileImage: 1,
          description: 1,
          productCount: 1,
          activityStatus: 1,
          email: 1,
          phone: 1,
          businessAddress:1,
          sellerUserId: "$userId"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sellers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSellers / limit),
        totalSellers,
        hasMore: page * limit < totalSellers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
