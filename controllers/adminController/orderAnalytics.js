import Order from "../../models/OrderModel.js";
import Product from "../../models/ProductModel.js";

// Helper function to format dates for grouping
const getStartDate = (period) => {
  const now = new Date();
  const start = new Date();
  
  switch(period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(now.getDate() - 7);
      break;
    case '30days':
      start.setDate(now.getDate() - 30);
      break;
    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(now.getDate() - 30); // Default to 30 days
  }
  
  return start;
};

// 1. Daily Revenue Trend
export const getDailyRevenueTrend = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    const startDate = getStartDate(period);
    
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'Cancelled' } // Exclude cancelled orders
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$product.productPrice' },
          date: { $first: '$createdAt' }
        }
      },
      {
        $sort: { 'date': 1 }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          totalRevenue: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue data'
    });
  }
};

// 2. Orders Trend (Daily/Weekly/Monthly)
export const getOrdersTrend = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    const startDate = getStartDate(period);
    
    let groupFormat = '%Y-%m-%d'; // Default: daily
    
    if (period === 'this_year') {
      groupFormat = '%Y-%m'; // Monthly for yearly view
    }
    
    const ordersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: groupFormat,
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 },
          date: { $first: '$createdAt' }
        }
      },
      {
        $sort: { 'date': 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: ordersData
    });
  } catch (error) {
    console.error('Orders trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders data'
    });
  }
};


// 4. Overall Statistics (Optional)
export const getOrderStatistics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    
    const [todayStats, yesterdayStats, last7DaysStats, last30DaysStats, statusStats] = await Promise.all([
      // Today's stats
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$product.productPrice' }
          }
        }
      ]),
      
      // Yesterday's stats
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: yesterday, $lt: today },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$product.productPrice' }
          }
        }
      ]),
      
      // Last 7 days stats
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$product.productPrice' }
          }
        }
      ]),
      
      // Last 30 days stats
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last30Days },
            status: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$product.productPrice' }
          }
        }
      ]),
      
      // Status breakdown
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        today: {
          orders: todayStats[0]?.count || 0,
          revenue: todayStats[0]?.revenue || 0
        },
        yesterday: {
          orders: yesterdayStats[0]?.count || 0,
          revenue: yesterdayStats[0]?.revenue || 0
        },
        last7Days: {
          orders: last7DaysStats[0]?.count || 0,
          revenue: last7DaysStats[0]?.revenue || 0
        },
        last30Days: {
          orders: last30DaysStats[0]?.count || 0,
          revenue: last30DaysStats[0]?.revenue || 0
        },
        statusBreakdown: statusStats
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
};


// 3. Best Selling Products
export const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const bestSellers = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' } // ignore cancelled orders
        }
      },
      {
        $group: {
          _id: '$product.id', // group by product id
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$product.productPrice' }
        }
      },
      // Lookup product details from Product collection
      {
        $lookup: {
          from: 'products', // collection name in MongoDB
          localField: '_id', // _id is product id from group
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails' // convert array to object
      },
      {
        $sort: { totalOrders: -1 } // top selling
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productDetails.title',
          productImage: '$productDetails.imageUrl', // adjust field names
          totalOrders: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: bestSellers
    });
  } catch (error) {
    console.error('Best sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best selling products'
    });
  }
};
