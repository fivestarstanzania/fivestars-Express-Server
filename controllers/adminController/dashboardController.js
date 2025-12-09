import Seller from "../../models/sellerModel.js";
import User from "../../models/User.js";
import Order from "../../models/OrderModel.js";
import Product from "../../models/ProductModel.js";
import DailyVisit from "../../models/DailyVisit.js";
import moment from "moment";


export async function getDashboardStats(req, res) {
  try {
    const today = moment().startOf("day");
    const yesterday = moment().subtract(1, "day").startOf("day");

    const todayStart = today.toDate();
    const todayEnd = moment().endOf("day").toDate();
    const yesterdayStart = yesterday.toDate();
    const yesterdayEnd = yesterday.endOf("day").toDate();

    const todayStr = today.format("YYYY-MM-DD");
    const yesterdayStr = yesterday.format("YYYY-MM-DD");

    // Run all DB queries in parallel
    const [
      totalSellers,
      totalProducts,
      totalCustomers,
      todaysOrders,
      yesterdaysOrders,
      pendingOrders,
      todayVisit,
      yesterdayVisit,
      // Get yesterday's totals for comparison
      sellersYesterday,
      productsYesterday,
      customersYesterday,
    ] = await Promise.all([
      Seller.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      Order.countDocuments({
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
      }),
      Order.countDocuments({ status: "Pending" }),
      DailyVisit.findOne({ date: todayStr }),
      DailyVisit.findOne({ date: yesterdayStr }),
      // Count documents created before today for yesterday's totals
      Seller.countDocuments({ createdAt: { $lt: todayStart } }),
      Product.countDocuments({ createdAt: { $lt: todayStart } }),
      User.countDocuments({ 
        role: "customer", 
        createdAt: { $lt: todayStart } 
      }),
    ]);

    // Helper function to calculate percentage change
    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? { change: 100, type: "increase" } : { change: 0, type: "same" };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        change: Math.abs(change).toFixed(1),
        type: change > 0 ? "increase" : change < 0 ? "decrease" : "same",
      };
    };

    const visitorsToday = todayVisit ? todayVisit.uniqueDevices : 0;
    const visitorsYesterday = yesterdayVisit ? yesterdayVisit.uniqueDevices : 0;
    const visitorsChange = calculateChange(visitorsToday, visitorsYesterday);

    const ordersChange = calculateChange(todaysOrders, yesterdaysOrders);
    const sellersChange = calculateChange(totalSellers, sellersYesterday);
    const productsChange = calculateChange(totalProducts, productsYesterday);
    const customersChange = calculateChange(totalCustomers, customersYesterday);

    const stats = [
      { 
        label: "Visitors Today", 
        value: visitorsToday,
        change: visitorsChange.change,
        changeType: visitorsChange.type,
      },
      { 
        label: "Total Sellers", 
        value: totalSellers,
        change: sellersChange.change,
        changeType: sellersChange.type,
      },
      { 
        label: "Total Products", 
        value: totalProducts,
        change: productsChange.change,
        changeType: productsChange.type,
      },
      { 
        label: "Customers", 
        value: totalCustomers,
        change: customersChange.change,
        changeType: customersChange.type,
      },
      { 
        label: "Today's Orders", 
        value: todaysOrders,
        change: ordersChange.change,
        changeType: ordersChange.type,
      },
      { 
        label: "Pending Orders", 
        value: pendingOrders,
        change: 0,
        changeType: "same",
      },
    ];

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
}

// Helper function for start date
const getStartDate = (period) => {
  const startDate = new Date();
  
  switch (period) {
    case "7days":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30days":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "this_year":
      startDate.setFullYear(startDate.getFullYear(), 0, 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return startDate;
};

export const getOrdersTrend = async (req, res) => {
  try {
    const { period = "30days" } = req.query;
    const startDate = getStartDate(period);
    
    let groupFormat = "%Y-%m-%d"; // Default: daily
    
    if (period === "this_year") {
      groupFormat = "%Y-%m"; // Monthly for yearly view
    }
    
    const ordersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: groupFormat,
                date: "$createdAt",
              },
            },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$product.productPrice" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          count: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: ordersData,
    });
  } catch (error) {
    console.error("Orders trend error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders data",
    });
  }
};