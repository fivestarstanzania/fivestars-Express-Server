// controllers/searchAnalyticsController.js
import mongoose from "mongoose";
import SearchLog from '../../models/SearchLog.js';
import User from '../../models/User.js';
import Product from '../../models/ProductModel.js';

// Admin IDs to exclude
const adminIds = [
  new mongoose.Types.ObjectId("67e560eced0c263f22ccf8c4"),
  new mongoose.Types.ObjectId("67ea0d6d93a411bd10d56b3a"),
  new mongoose.Types.ObjectId("67fe9da1de96637c4896da2a")
];

// -----------------------------------------------
// Get search analytics with filtering
// -----------------------------------------------
export async function getSearchAnalytics(req, res) {
  try {
    const { page = 1, limit = 20, dateFilter = 'all', searchKeyword, zeroResults } = req.query;
    const skip = (page - 1) * limit;

    // Build date filter
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

    // EXCLUDE ADMIN USERS
    let query = {
      ...dateQuery,
      userId: { $nin: adminIds }
    };

    // Filter zero results
    if (zeroResults === 'true') {
      query.resultsFound = 0;
    }

    // Search filter
    if (searchKeyword) {
      query.keyword = { $regex: searchKeyword, $options: 'i' };
    }

    const searchAggregation = await SearchLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$keyword',
          count: { $sum: 1 },
          userCount: { $addToSet: '$userId' },
          resultsFound: { $first: '$resultsFound' },
          lastSearched: { $max: '$createdAt' },
          firstSearched: { $min: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userCount',
          foreignField: '_id',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'products',
          let: { searchKeyword: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $regexMatch: {
                    input: '$title',
                    regex: '$$searchKeyword',
                    options: 'i'
                  }
                },
                sellerStatus: { $ne: "Banned" }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'sellerId',
                foreignField: '_id',
                as: 'seller'
              }
            },
            {
              $match: {
                'seller.activityStatus': { $ne: "Banned" }
              }
            },
            {
              $project: {
                title: 1,
                price: 1,
                imageUrl: 1,
                category: 1,
                sellerName: { $arrayElemAt: ['$seller.name', 0] }
              }
            },
            { $limit: 3 }
          ],
          as: 'matchingProducts'
        }
      },
      {
        $project: {
          keyword: '$_id',
          count: 1,
          resultsFound: 1,
          userCount: { $size: '$userCount' },
          users: {
            $map: {
              input: '$users',
              as: 'user',
              in: { name: '$$user.name', email: '$$user.email' }
            }
          },
          matchingProducts: 1,
          lastSearched: 1,
          firstSearched: 1
        }
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const totalResults = await SearchLog.aggregate([
      { $match: query },
      { $group: { _id: '$keyword' } },
      { $count: 'total' }
    ]);

    const total = totalResults[0]?.total || 0;

    res.json({
      searches: searchAggregation,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        resultsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      message: 'Failed to fetch search analytics',
      error: error.message
    });
  }
}

// -----------------------------------------------
// Get search trends
// -----------------------------------------------
export async function getSearchTrends(req, res) {
  try {
    const { limit = 10, dateFilter = '30d' } = req.query;

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

    // ADMIN FILTER
    const query = {
      ...dateQuery,
      userId: { $nin: adminIds }
    };

    const trends = await SearchLog.aggregate([
      { $match: query },
      { $group: { _id: '$keyword', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ trends });

  } catch (error) {
    console.error('Search trends error:', error);
    res.status(500).json({
      message: 'Failed to fetch search trends',
      error: error.message
    });
  }
}

// -----------------------------------------------
// Zero result search summary
// -----------------------------------------------
export async function getZeroResultSummary(req, res) {
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

    // ADMIN FILTER
    const query = {
      ...dateQuery,
      userId: { $nin: adminIds },
      resultsFound: 0
    };

    const zeroResultSummary = await SearchLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          uniqueKeywords: { $addToSet: '$keyword' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSearches: 1,
          uniqueKeywordsCount: { $size: '$uniqueKeywords' }
        }
      }
    ]);

    res.json(zeroResultSummary[0] || {
      totalSearches: 0,
      uniqueKeywordsCount: 0
    });

  } catch (error) {
    console.error('Zero result summary error:', error);
    res.status(500).json({
      message: 'Failed to fetch zero result summary',
      error: error.message
    });
  }
}
