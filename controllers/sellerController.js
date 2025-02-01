import Seller from "../models/sellerModel.js";
import User from "../models/User.js";

export const createSeller = async (req, res) => {
  try {
    const {
      sellerId,
      name,
      email,
      phone,
      profileImage,
      description,
      businessName,
      businessAddress,
    } = req.body;

    // Check if the provided sellerId exists in the User collection
    const userExists = await User.findById(sellerId);
    if (!userExists) {
      return res.status(404).json({ message: "The provided sellerId does not exist in the User database." });
    }


    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Seller with this email already exists." });
    }

    const newSeller = new Seller({
      sellerId,
      name,
      email,
      phone,
      profileImage,
      description,
      businessName,
      businessAddress,
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

    res.status(200).json({ message: "Seller fetched successfully", data: seller });
  } catch (error) {
    res.status(500).json({ message: "Error fetching seller", error: error.message });
  }
};

export const deleteSellerById = async (req, res) => {
  try {
    const { id } = req.params; // Seller ID
    const deletedSeller = await Seller.findByIdAndDelete(id);

    if (!deletedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ message: "Seller deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting seller", error: error.message });
  }
};
