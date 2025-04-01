import Order from "../models/OrderModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const updateSellerPendingCount = async (sellerId) => {
    const pendingCount = await Order.countDocuments({
      "seller.id": sellerId,
      status: "Pending",
    });

    const sellerSocketId = getReceiverSocketId(sellerId.toString());
    
    if(sellerSocketId){
        io.to(sellerSocketId).emit("pendingOrdersUpdate", {
            totalPendingOrders: pendingCount
        })
    }
};