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
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build one pipeline so filtering, pagination, and totals all use the same result set.
    const [result] = await ProductClickLog.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          userId: { $nin: EXCLUDED_OBJECT_IDS }
        }
      },
      {
        $group: {
          _id: "$productId",
          clickCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "sellers",
          localField: "product.sellerId",
          foreignField: "_id",
          as: "sellerInfo"
        }
      },
      { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          "product.isActive": { $ne: false }, // treat missing isActive (old products) as active
          "sellerInfo.activityStatus": { $ne: "Banned" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerInfo.userId",
          foreignField: "_id",
          as: "sellerUser"
        }
      },
      { $unwind: { path: "$sellerUser", preserveNullAndEmptyArrays: true } },
      { $sort: { clickCount: -1, _id: 1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: "$product._id",
                title: "$product.title",
                price: "$product.price",
                regularPrice: "$product.regularPrice",
                imageUrl: "$product.imageUrl",
                imageUrls: "$product.imageUrls",
                description: "$product.description",
                category: "$product.category",
                createdAt: "$product.createdAt",
                clickCount: "$product.clickCount",
                recentClickCount: "$clickCount",
                sellerInfo: {
                  name: "$sellerInfo.name",
                  businessName: "$sellerInfo.businessName",
                  profileImage: "$sellerInfo.profileImage"
                },
                sellerUser: {
                  name: "$sellerUser.name"
                }
              }
            }
          ],
          totalCount: [
            { $count: "total" }
          ]
        }
      }
    ]);

    const products = result?.data || [];
    const total = result?.totalCount?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasMore: skip + products.length < total
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