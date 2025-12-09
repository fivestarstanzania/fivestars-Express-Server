import Order from "../../models/OrderModel.js";
import Product from "../../models/ProductModel.js";

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Order.find().sort({ createdAt: -1 });

    // Map orders to include product title
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        // Fetch product title using the product.id stored in order
        const product = await Product.findById(order.product.id).select("title");

        return {
          ...order.toObject(), // keep all fields as stored
          product: {
            ...order.product, // keep productImage, productPrice, id
            productTitle: product ? product.title : "Unknown Product",
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      total: enrichedOrders.length,
      orders: enrichedOrders,
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Fetch product title
    const product = await Product.findById(order.product.id).select("title");

    // Build final response
    const orderDetail = {
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,

      buyer: {
        name: order.buyer.name,
        contact: order.buyer.contact,
        address: order.buyer.address,
      },

      seller: {
        name: order.seller.name,
        phone: order.seller.phone,
      },

      product: {
        image: order.product.productImage,
        price: order.product.productPrice,
        title: product ? product.title : "Unknown Product",
      },

      date: order.createdAt,
    };

    res.status(200).json({
      success: true,
      order: orderDetail,
    });

  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = {};
    
    // Only update status if provided
    if (status) {
      const validStatuses = ["Pending", "Received", "Confirmed", "Delivered", "Cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }
      updateData.status = status;
    }
    
    // Keep buyer and seller fields read-only in this simplified version
    // Or you can remove these sections entirely if they shouldn't be updated
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Format response similar to getOrderById
    const responseOrder = {
      _id: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      buyer: {
        name: updatedOrder.buyer.name,
        contact: updatedOrder.buyer.contact,
        address: updatedOrder.buyer.address,
      },
      seller: {
        name: updatedOrder.seller.name,
        phone: updatedOrder.seller.phone,
      },
      product: {
        image: updatedOrder.product.productImage,
        price: updatedOrder.product.productPrice,
        title: updatedOrder.product.productTitle,
      },
      date: updatedOrder.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: responseOrder
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

