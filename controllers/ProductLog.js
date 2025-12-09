import mongoose from 'mongoose';
import ProductClickLog from '../models/ProductClickLog.js';
import Product from '../models/ProductModel.js';


const EXCLUDED_USER_IDS = [
  "67e560eced0c263f22ccf8c4",
  "67ea0d6d93a411bd10d56b3a",
  "67fe9da1de96637c4896da2a"
];

const EXCLUDED_OBJECT_IDS = EXCLUDED_USER_IDS.map(id => new mongoose.Types.ObjectId(id));

// Log a product click

export const logProductClick = async (req, res) => {
  try {
    const { productId, productTitle, source = "home" } = req.body;
    const userId = req.user?._id || null;

    if (!productId || !productTitle) {
      return res.status(400).json({
        success: false,
        message: "Product ID and title are required"
      });
    }

    // Log the click
    await ProductClickLog.create({
      productId,
      productTitle,
      userId,
      source
    });

    // Increment click count in Product model
    await Product.findByIdAndUpdate(productId, {
      $inc: { clickCount: 1 }
    });

    res.status(200).json({
      success: true,
      message: "Click logged successfully"
    });
  } catch (error) {
    console.error("Error logging product click:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log click"
    });
  }
};

// Get popular products in last 30 days
export const getPopularProducts = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Calculate date 30 days ago 
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate clicks in last 30 days excluding admin users
    const popularProducts = await ProductClickLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          userId: { $nin: EXCLUDED_OBJECT_IDS }
        }
      },
      {
        $group: {
          _id: "$productId",
          productTitle: { $first: "$productTitle" },
          clickCount: { $sum: 1 }
        }
      },
      { $sort: { clickCount: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get full product details for popular products
    const productIds = popularProducts.map(p => p._id);
    const products = await Product.find({ 
      _id: { $in: productIds },
      sellerStatus: "Active" // Only show active products
    })
    .populate('sellerId', 'name businessName profileImage')
    .lean();

    // Merge click count with product data
    const productsWithClicks = products.map(product => {
      const clickData = popularProducts.find(p => 
        p._id.toString() === product._id.toString()
      );
      return {
        ...product,
        recentClickCount: clickData?.clickCount || 0
      };
    });

    // Sort by click count (already sorted by aggregation, but ensure after merge)
    productsWithClicks.sort((a, b) => b.recentClickCount - a.recentClickCount);

    // Get total count for pagination
    const totalClicks = await ProductClickLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$productId"
        }
      },
      {
        $count: "total"
      }
    ]);

    const total = totalClicks[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: productsWithClicks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasMore: skip + productsWithClicks.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching popular products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular products"
    });
  }
};