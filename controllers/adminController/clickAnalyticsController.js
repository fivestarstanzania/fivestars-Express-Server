// controllers/clickAnalyticsController.js

import mongoose from "mongoose";
import ProductClickLog from '../../models/ProductClickLog.js';
import Product from '../../models/ProductModel.js';
import User from '../../models/User.js';

const EXCLUDED_USER_IDS = [
  "67e560eced0c263f22ccf8c4",
  "67ea0d6d93a411bd10d56b3a",
  "67fe9da1de96637c4896da2a"
];

const EXCLUDED_OBJECT_IDS = EXCLUDED_USER_IDS.map(
  id => new mongoose.Types.ObjectId(id)
);


// =======================================================
// 📌 CLICK ANALYTICS LIST
// =======================================================
export async function getClickAnalytics(req, res) {
  try {
    const { page = 1, limit = 15, dateFilter = 'all', sortBy = 'popularity' } = req.query;
    const skip = (page - 1) * limit;

    let dateQuery = {};
    const now = new Date();

    switch(dateFilter) {
      case 'today':
        dateQuery.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case '7d':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateQuery.createdAt = { $gte: weekAgo };
        break;
      case '30d':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateQuery.createdAt = { $gte: monthAgo };
        break;
    }

    let sortCriteria = {};
    if (sortBy === "popularity") sortCriteria = { clickCount: -1 };
    if (sortBy === "recent") sortCriteria = { lastClicked: -1 };

    const clickAggregation = await ProductClickLog.aggregate([
      {
        $match: {
          ...dateQuery,
          userId: { $nin: EXCLUDED_OBJECT_IDS }
        }
      },
      {
        $group: {
          _id: "$productId",
          clickCount: { $sum: 1 },
          productTitle: { $first: "$productTitle" },
          sources: { $push: "$source" },
          users: { $addToSet: "$userId" },
          lastClicked: { $max: "$createdAt" },
          firstClicked: { $min: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $project: {
          productId: "$_id",
          title: "$productTitle",
          clickCount: 1,
          sourceBreakdown: {
            search: {
              $size: {
                $filter: { input: "$sources", as: "s", cond: { $eq: ["$$s", "search"] } }
              }
            },
            home: {
              $size: {
                $filter: { input: "$sources", as: "s", cond: { $eq: ["$$s", "home"] } }
              }
            },
            category: {
              $size: {
                $filter: { input: "$sources", as: "s", cond: { $eq: ["$$s", "category"] } }
              }
            },
            offer: {
              $size: {
                $filter: { input: "$sources", as: "s", cond: { $eq: ["$$s", "offer"] } }
              }
            },
            other: {
              $size: {
                $filter: { input: "$sources", as: "s", cond: { $eq: ["$$s", "other"] } }
              }
            }
          },
          users: {
            $map: {
              input: "$userDetails",
              as: "u",
              in: { name: "$$u.name", email: "$$u.email" }
            }
          },
          productImage: "$productDetails.imageUrl",
          productPrice: "$productDetails.price",
          productCategory: "$productDetails.category",
          lastClicked: 1,
          firstClicked: 1
        }
      },
      { $sort: sortCriteria },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Total Count
    const totalResults = await ProductClickLog.aggregate([
      {
        $match: {
          ...dateQuery,
          userId: { $nin: EXCLUDED_OBJECT_IDS }
        }
      },
      { $group: { _id: "$productId" } },
      { $count: "total" }
    ]);

    const total = totalResults[0]?.total || 0;

    res.json({
      clicks: clickAggregation,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Click analytics error:", error);
    res.status(500).json({
      message: "Failed to fetch click analytics",
      error: error.message
    });
  }
}



// =======================================================
// 📌 CLICK SUMMARY (FIXED VERSION)
// =======================================================
export async function getClickSummary(req, res) {
  try {
    const { dateFilter = '30d' } = req.query;

    let dateQuery = {};
    const now = new Date();

    switch(dateFilter) {
      case 'today':
        dateQuery.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case '7d':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateQuery.createdAt = { $gte: weekAgo };
        break;
      case '30d':
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateQuery.createdAt = { $gte: monthAgo };
        break;
    }

    const summary = await ProductClickLog.aggregate([
      {
        $match: {
          ...dateQuery,
          userId: { $nin: EXCLUDED_OBJECT_IDS }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: 1 },
          uniqueProducts: { $addToSet: "$productId" },
          uniqueUsers: { $addToSet: "$userId" },

          // Flatten accumulators (MongoDB requires this!)
          searchClicks: { $sum: { $cond: [{ $eq: ["$source", "search"] }, 1, 0] } },
          homeClicks: { $sum: { $cond: [{ $eq: ["$source", "home"] }, 1, 0] } },
          categoryClicks: { $sum: { $cond: [{ $eq: ["$source", "category"] }, 1, 0] } },
          offerClicks: { $sum: { $cond: [{ $eq: ["$source", "offer"] }, 1, 0] } },
          otherClicks: { $sum: { $cond: [{ $eq: ["$source", "other"] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalClicks: 1,
          uniqueProductsCount: { $size: "$uniqueProducts" },
          uniqueUsersCount: { $size: "$uniqueUsers" },

          // Rebuild nested object AFTER grouping
          sourceBreakdown: {
            search: "$searchClicks",
            home: "$homeClicks",
            category: "$categoryClicks",
            offer: "$offerClicks",
            other: "$otherClicks"
          }
        }
      }
    ]);

    res.json(summary[0] || {
      totalClicks: 0,
      uniqueProductsCount: 0,
      uniqueUsersCount: 0,
      sourceBreakdown: {
        search: 0, home: 0, category: 0, offer: 0, other: 0
      }
    });

  } catch (error) {
    console.error("Click summary error:", error);
    res.status(500).json({
      message: "Failed to fetch click summary",
      error: error.message
    });
  }
}
