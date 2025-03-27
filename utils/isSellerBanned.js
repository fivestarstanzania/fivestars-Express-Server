import Seller from '../models/sellerModel.js'

// Function to check if a seller is banned
export const isSellerBanned = async (sellerId) => {
    const seller = await Seller.findById(sellerId);
    return seller && seller.activityStatus === "Banned";
};