import User from '../../models/User.js';
import Seller from "../../models/sellerModel.js";
import Order from "../../models/OrderModel.js";
import Review from "../../models/ReviewsModel.js";
import Feedback from "../../models/feedbackModel.js";


export async function getAllUsers(req,res){
    try {
      const users = await User.find().sort({ createdAt: -1 });
      const totalUsers = await User.countDocuments();
      // Respond with both the total number and the products
      res.status(200).json({
        total: totalUsers,
        users,
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({message:"error fetching users"});
    }
}
  

export async function  deleteUser(req,res){
    const { id } = req.params;
  
    try {
      // Find the user by ID
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // If user is a seller, delete from sellers table as well
      if (user.role === "seller") {
        await Seller.findOneAndDelete({ sellerId:id });
      }
  
      // Delete the user from users table
      await User.findByIdAndDelete(id);
  
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  
}


export async function adminGetUserDetails(req, res) {
  try {
    const { id } = req.params;

    // 1. Fetch user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Fetch user's orders
    const orders = await Order.find({ "buyer.id": id })
      .sort({ createdAt: -1 })
      .select("orderNumber status createdAt product.name product.review productPrice");

    
    // 3. Get user's reviews
    const reviews = await Review.find({ userId: id }).sort({ createdAt: -1 });


    // 4. Fetch feedbacks
    const feedbacks = await Feedback.find({ email: user.email })
      .sort({ createdAt: -1 });

    // 5. Response
    res.json({
      user,
      activities: {
        orders,
        reviews,
        feedbacks
      }
    });

  } catch (error) {
    console.error("User Details Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
