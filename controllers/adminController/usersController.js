import User from '../../models/User.js';
import Seller from "../../models/sellerModel.js";


export async function getAllUsers(req,res){
    try {
      const users = await User.find();
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