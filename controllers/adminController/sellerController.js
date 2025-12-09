import Seller from "../../models/sellerModel.js";
import User from "../../models/User.js";
import Review from '../../models/ReviewsModel.js'
import Product from "../../models/ProductModel.js";
import SellerApplication from "../../models/SellerApplication.js";
import multer from "multer";
import {sellerStorage, cloudinary} from "../../utils/cloudinary.js"; 
import Order from "../../models/OrderModel.js";
export const upload = multer({ storage:sellerStorage });
import mongoose from "mongoose";


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
      //console.log("Please fill in all required fields.");
      return res.status(400).json({ error: "Please fill in all required fields." });
      
    }
    //console.log("check 1")

     // Find user by email in the User collection
     const user = await User.findOne({ email });
     if (!user) {
      //console.log("User not found in the database.")
       return res.status(404).json({ message: "User not found in the database." });
     }

     const userId = user._id;
     //console.log("check 2")
    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      //console.log("Seller with this email already exists.")
      return res.status(400).json({ message: "Seller with this email already exists." });
    }


    // Don't change user role yet - wait for agreement
    user.role = "pending-seller";
    await user.save(); 

    //console.log("check 3")
    
    //const businessAddress = JSON.parse(req.body.businessAddress);
    const businessAddress = 
  typeof req.body.businessAddress === "string"
    ? JSON.parse(req.body.businessAddress)
    : req.body.businessAddress;
    const newSeller = new Seller({
      userId,
      name,
      email,
      phone,
      description,
      businessName,
      businessAddress,
      profileImage: req.file ? req.file.path : null,
      activityStatus: "PendingAgreement",
      hasAgreedToTerms: false
    });

    //console.log("check 4")

    const savedSeller = await newSeller.save();
    //console.log("check 5")
    res.status(201).json({ message: "Seller created successfully. Please agree to the terms to activate your seller account.", data: savedSeller });
  } catch (error) {
    res.status(500).json({ message: "Error creating seller", error: error.message });
    //console.log(error)
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
    //console.log(sellerId)

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
    const sellers = await Seller.find().sort({ createdAt: -1 });

    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        const productCount = await Product.countDocuments({ sellerId: seller._id });

        const orders = await Order.aggregate([
  {
    $match: {
      "seller.id": seller.userId,   // <-- Correct match!
      status: "Delivered",
    },
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: "$product.productPrice" },
    },
  },
]);


        return {
          ...seller.toObject(),
          productCount,
          totalSales: orders[0]?.totalSales || 0,
        };
      })
    );

    const totalSellers = await Seller.countDocuments();

    res.status(200).json({
      total: totalSellers,
      sellers: sellersWithStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching sellers" });
  }
};


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


export const getAllSellerApplications = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};

    // Optional filtering: ?status=pending | approved | rejected
    if (status) query.status = status;

   
    const applications = await SellerApplication.find(query)
      .populate("userId", "name email") // optional: get user basic info
      .populate("reviewedBy", "name email") // optional: admin info
      .sort({ submittedAt: -1 }) // latest first
     

    const total = await SellerApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      total: applications.length,
      applications,
    });

  } catch (error) {
    console.error("Error fetching seller applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving seller applications",
    });
  }
};

export const getSellerApplicationById = async (req, res) => {
  try {
    const { id } = req.params; // get application ID from URL

    // Find application by ID and populate related user/admin info
    const application = await SellerApplication.findById(id)
      .populate("userId", "name email")       // applicant info
      .populate("reviewedBy", "name email"); // admin who reviewed

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error fetching seller application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving seller application",
    });
  }
};

export const updateSellerApplication = async (req, res) => {
  try {
    const { id } = req.params; // Application ID from URL
    const updates = req.body;  // Fields to update

    // Find application by ID and update
    const updatedApplication = await SellerApplication.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true } // return updated doc & validate fields
    ).populate("userId", "name email")
     .populate("reviewedBy", "name email");

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error updating seller application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating seller application",
      error: error.message,
    });
  }
};


export const rejectSellerApplication = async (req, res) => {
  try {
    console.log("rejectSellerApplication called");
    const { id } = req.params; // application ID
    const { rejectionReason } = req.body; // reason for rejection
    //const { id: adminId } = req.session.user; // admin who rejects

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Find and update the application
    const application = await SellerApplication.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionReason,
        reviewedAt: new Date(),
      },
      { new: true }
    )

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    
    // Optionally, update the user document to reflect rejection
    await User.findByIdAndUpdate(application.userId, {
      "sellerApplication.status": "rejected",
      "sellerApplication.rejectionReason": rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: "Application rejected successfully",
      application,
    });
  } catch (error) {
    console.error("Error rejecting seller application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting application",
      error: error.message,
    });
  }
};

// Delete seller application by ID
export const deleteSellerApplication = async (req, res) => {
  try {
    const { id } = req.params; // Application ID from URL

    // Find and delete the application
    const deletedApplication = await SellerApplication.findByIdAndDelete(id);

    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

     // Optionally, update the user document to reflect rejection
    if (deletedApplication.userId) {
      await User.findByIdAndUpdate(deletedApplication.userId, {
        "sellerApplication.status": "not-applied",
        "sellerApplication.rejectionReason":  "",
      });
    }

    res.status(200).json({
      success: true,
      message: "Seller application deleted successfully",
      application: deletedApplication,
    });
  } catch (error) {
    console.error("Error deleting seller application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting seller application",
      error: error.message,
    });
  }
};



// Admin approves a seller application
export const approveSellerApplication = async (req, res) => {
  console.log("Approve seller application called");
  try {
    
    const { applicationId } = req.params;

    // 1. Find the application
    const application = await SellerApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Seller application not found",
      });
    }

    // 2. Check if seller already exists
    const existingSeller = await Seller.findOne({ userId: application.userId });
if (existingSeller) {
  return res.status(400).json({
    success: false,
    message: "This user is already registered as a seller",
  });
}

    // 3. Create Seller from application data
    const newSeller = new Seller({
      userId: application.userId,
      name: application.name,
      email: application.email,
      phone: application.phone,
      description: application.description,
      businessName: application.businessName,
      businessAddress: application.businessAddress,
      profileImage: application.profileImage || null,
      activityStatus: "PendingAgreement", // Admin approved
      hasAgreedToTerms: false,   // Assuming admin approval counts as agreement
    });

    const savedSeller = await newSeller.save();

    // 4. Update the user role and sellerApplication status
    await User.findByIdAndUpdate(application.userId, {
      role: "seller",
      "sellerApplication.status": "approved",
      "sellerApplication.rejectionReason": "",
    });

    // 5. Update application status (optional: mark reviewed)
    application.status = "approved";
    application.reviewedAt = new Date();
    // If you have an admin reference: application.reviewedBy = req.adminId;
    await application.save();

    res.status(201).json({
      success: true,
      message: "Seller application approved and seller created successfully",
      seller: savedSeller,
      application,
    });
  } catch (error) {
    console.error("Error approving seller application:", error);
    res.status(500).json({
      success: false,
      message: "Server error while approving seller application",
      error: error.message,
    });
  }
};
