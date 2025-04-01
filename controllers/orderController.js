import  Order from "../models/OrderModel.js";
import User from '../models/User.js';
import Product from "../models/ProductModel.js";
import Notification from "../models/notificationModel.js";
import axios from "axios";
import {io,getReceiverSocketId } from "../socket/socket.js";
import { updateSellerPendingCount } from "../utils/countPendingOrders.js";


export async function createOrder(req, res) {
  const buyerId = req.user._id;
  //console.log("check1")
  try {
    const { buyer, sellerUserId, status, productId } = req.body;

    if (!buyer || !buyer.name || !buyer.contact || !buyer.address) {
      console.log("Buyer details are incomplete")
      return res.status(400).json({ message: "Buyer details are incomplete" });
    }

    if (!sellerUserId) {
      console.log("Seller ID is required")
      return res.status(400).json({ message: "Seller ID is required" });
    }

    if (!productId) {
      console.log("Product ID is required")
      return res.status(400).json({ message: "Product ID is required" });
    }
    //console.log("check2")
    const sellerDetails = await User.findById(sellerUserId);
    if (!sellerDetails) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (sellerDetails.role !== "seller") {
        return res.status(403).json({ message: "The specified user is not a seller" });
    }
    //console.log("check3")
    const productDetails = await Product.findById(productId);
    if (!productDetails) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Generate a unique order ID
    const timestamp = Date.now();
    const randomValue = Math.floor(Math.random() * 10000);
    const orderNumber = `ORD-${timestamp}-${randomValue}`;

    // Create a new order
    const newOrder = new Order({
      orderNumber,
      buyer:{
        id: buyerId, 
        name: buyer.name, 
        contact:buyer.contact,
        address:buyer.address,
      },
      seller:{
        id: sellerDetails._id, 
        name: sellerDetails.name, 
      },
      status,
      product: {
        id:productId,
        productImage: productDetails.imageUrl, 
        productPrice: productDetails.price, 
        
      },
    });
    //console.log("check4")
    // Save the order to the database
    await newOrder.save();
    

    if(newOrder.status==="Pending"){
      await updateSellerPendingCount(newOrder.seller.id)
    }

    // Send real-time notification to the seller
    const title = "New order"
    const message = `New order number ${orderNumber} has been placed.`;
    const newNotification = new Notification({ 
      receiverId: sellerUserId, 
      title,
      message,
      type: "Order",
      metadata: {
        orderId: newOrder._id,
        productId,
        toward:"seller",
      },

    });
    await newNotification.save();
    //console.log(`saved notification`)

    //console.log("check5")
    // use socket to send update
    const sellerSocketId = getReceiverSocketId(newOrder.seller.id.toString());
    
    if(sellerSocketId){
      io.to(sellerSocketId).emit("newOrder", newOrder)
    }
    
    // Get seller's Expo push token
    const sellerDetail = await User.findById(sellerUserId);
    const expoPushToken = sellerDetail.expoPushToken;
    //console.log(expoPushToken)
    //console.log("check6")
    if (expoPushToken) {
      try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', {
          to: expoPushToken,
          title: newNotification.title,
          body: newNotification.message,
          priority:'high',
          sound: 'default',
        });
        //console.log("check7")
        //console.log('Notification sent on creating order:', response.data);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }  
    //console.log("check8")
    res.status(201).json({ message: "Order created and seller notified!", order: newOrder });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export async function getAllOrders(req, res) {
  const receiverId = req.user._id;
  try {
    // Retrieve all orders where the buyer's ID matches the receiverId
    const orders = await Order.find({ "buyer.id": receiverId }).sort({createdAt:-1});

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this buyer." });
    }

    const formattedOrders = orders.map((order) => ({
      ...order._doc,
      createdAt: new Date(order.createdAt).toLocaleString(), // Format the date
    }));
    res.status(200).json({ message: "Orders retrieved successfully", orders: formattedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve orders" });
  }
}

export async function getSellerOrders(req, res) {
  const receiverId = req.user._id; // The ID of the logged-in user
  try {
    // Retrieve all orders where the seller's ID matches the receiverId
    const orders = await Order.find({ "seller.id": receiverId }).sort({createdAt:-1});
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this seller." });
    }
    // Format createdAt for each order
    const formattedOrders = orders.map((order) => ({
      ...order._doc,
      createdAt: new Date(order.createdAt).toLocaleString(), // Format the date
    }));
    res.status(200).json({ message: "Orders retrieved successfully", orders: formattedOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve seller's orders" });
  }
};

export async function getOrderDetails(req, res) {
  const { orderId } = req.query; 
  //console.log(`finding order with id: ${orderId} and `, req.body )
  try {
    if (!orderId) {
      return res.status(400).json({ message: "Order number or order ID is required." });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Order details retrieved successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve order details" });
  }
}

export async function  getRecentOrders(req, res){
  //console.log("here for last three orders")
  const sellerId = req.user._id;
  try {
    const orders = await Order.find({ "seller.id": sellerId }).sort({createdAt:-1})
      .limit(3); // Return only the top 3 orders
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Failed to fetch recent orders" });
  }
};

export async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body; 
  //console.log(`finding order with id: ${orderId} and `, req.body )
  
  try {
    // Find the order by ID
    const oldOrder = await Order.findById(orderId);
    if (!oldOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    
    // Update the status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found after update" });
    }


    // Check if pending status changed
    const wasPending = oldOrder.status === 'Pending';
    const nowPending = status === 'Pending';

    if (wasPending !== nowPending) {
      await updateSellerPendingCount(updatedOrder.seller.id);
    }

    //console.log("order:", order)

    // Notify the buyer about the status update
    const title = `Order ${status}`
    const message = `Your Order number: ${updatedOrder.orderNumber} has been ${status}.`;

    const buyerId = updatedOrder.buyer?.id?.toString();
    const sellerId = updatedOrder.seller?.id?.toString();

    if (!buyerId || !sellerId) {
      return res.status(400).json({ message: "Buyer or Seller info missing in the order" });
    }

    const newNotification = new Notification({
      receiverId: buyerId,
      title,
      message,
      type: "Order",
      metadata: {
        orderId: updatedOrder._id,
        toward:"buyer"
      },
      
    });
    await newNotification.save();
    
    //use socket
    const buyerSocketId = getReceiverSocketId(updatedOrder.buyer.id.toString());
    const sellerSocketId = getReceiverSocketId(updatedOrder.seller.id.toString());
    
    if(sellerSocketId){
      
      io.to( sellerSocketId).emit("orderStatusUpdate", updatedOrder)
      console.log("order status updated by socket to seller")
    }
    if (buyerSocketId) {
      // Send order update
      io.to(buyerSocketId).emit("orderStatusUpdate", updatedOrder);
      console.log("order statu supdated by socket to buyer")

      // Send notification
      io.to(buyerSocketId).emit("newNotification", newNotification);
    }
    

  
    const user = await User.findById(buyerId);
    
    const expoPushToken = user?.expoPushToken;

    
    if (expoPushToken) {
      try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', {
          to: expoPushToken,
          title: newNotification.title,
          body: newNotification.message,
          priority: 'high',
          sound: "default", 
          channelId: 'default',
          data:updatedOrder,
        });
        //console.log('Notification sent on update order status:', response.data);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }


    res.status(200).json({order:updatedOrder});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getTotalNumberPendingOrders(req, res) {

  const sellerId = req.user._id;
  try {
    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required." });
    }

    // Count orders where the seller.id matches and status is "pending"
    const pendingOrdersCount = await Order.countDocuments({
      "seller.id": sellerId,
      status: "Pending",
    });

    
    res.status(200).json({ totalPendingOrders: pendingOrdersCount });
  } catch (error) {
    console.error("Error fetching total number of pending orders:", error);
    res.status(500).json({ message: "Failed to get the total number of pending orders." });
  }

}
