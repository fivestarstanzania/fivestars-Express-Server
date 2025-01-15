import  Order from "../models/OrderModel.js";
import User from '../models/User.js';
import Product from "../models/ProductModel.js";
import Notification from "../models/notificationModel.js";
import { getReceiverSocketId } from "../socket/socket.js";
export async function createOrder(req, res) {
  const buyerId = req.user._id;
  try {
    const { buyer, seller, status, productId } = req.body;

    if (!buyer || !buyer.name || !buyer.contact || !buyer.address) {
        return res.status(400).json({ message: "Buyer details are incomplete" });
    }

    if (!seller) {
        return res.status(400).json({ message: "Seller ID is required" });
    }

    if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
    }

    const sellerDetails = await User.findById(seller);
    if (!sellerDetails) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (sellerDetails.role !== "seller") {
        return res.status(403).json({ message: "The specified user is not a seller" });
    }

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
        productImage: productDetails.imageUrl, 
        productPrice: productDetails.price, 
      },
    });

    // Save the order to the database
    await newOrder.save();
    

    // Send real-time notification to the seller
    const message = `Order ${orderNumber} has been placed.`;
    const newNotification = new Notification({ receiverId: seller, message });
    await newNotification.save();

    const receiverSocketId = getReceiverSocketId(seller);
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("newNotification", newNotification);
      console.log(newNotification)
    }

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
}

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
  console.log("here for last three orders")
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
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the status
    order.status = status;

    // Save the updated order
    await order.save();

    // Return the updated order
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}