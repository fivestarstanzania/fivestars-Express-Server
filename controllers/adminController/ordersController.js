import  Order from "../../models/OrderModel.js";


export async function getAllOrdersForAdmin(req, res) {
    try {
        // Fetch all products and count the total number
        const orders = await Order.find().sort({ createdAt: -1 });
       
        const totalOrders = await Order.countDocuments();

        // Respond with both the total number and the products
        res.status(200).json({
            total: totalOrders,
            orders,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to get the products" });
    }
}