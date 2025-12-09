import Wishlist from "../../models/WishlistModel.js";
import User from "../../models/User.js";
import Product from "../../models/ProductModel.js";

// Get all wishlists with user and product details
export const getAllWishlists = async (req, res) => {
  try {
    const { sort = "recent", limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Get all wishlists with populated user and product details
    let wishlistsQuery = Wishlist.find()
      .populate({
        path: "user",
        select: "name email profileImage", // Select only needed user fields
      })
      .populate({
        path: "product",
        select: "title price imageUrl", // Select only needed product fields
      });

    // Sort by recent or most wishlisted
    if (sort === "recent") {
      wishlistsQuery = wishlistsQuery.sort({ createdAt: -1 });
    } else if (sort === "oldest") {
      wishlistsQuery = wishlistsQuery.sort({ createdAt: 1 });
    }

    // Pagination
    wishlistsQuery = wishlistsQuery.skip(skip).limit(parseInt(limit));

    const wishlists = await wishlistsQuery;
    const total = await Wishlist.countDocuments();

    // Format the response
    const formattedWishlists = wishlists.map((wishlist) => ({
      _id: wishlist._id,
      user: {
        id: wishlist.user?._id,
        name: wishlist.user?.name || "Unknown User",
        email: wishlist.user?.email || "No email",
        profileImage: wishlist.user?.profileImage,
      },
      product: {
        id: wishlist.product?._id,
        title: wishlist.product?.title || "Product not found",
        price: wishlist.product?.price || 0,
        imageUrl: wishlist.product?.imageUrl || "",
      },
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    }));

    res.status(200).json({
      success: true,
      wishlists: formattedWishlists,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlists",
      error: error.message,
    });
  }
};

// Get most wishlisted products (grouped by product)
export const getMostWishlistedProducts = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Aggregate to get most wishlisted products
    const wishlistedProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: "$product",
          wishlistCount: { $sum: 1 },
          // Get the latest wishlist date for this product
          latestWishlist: { $max: "$createdAt" },
          // Get all users who wishlisted this product
          users: { $push: "$user" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          product: {
            id: "$_id",
            title: "$productDetails.title",
            price: "$productDetails.price",
            imageUrl: "$productDetails.imageUrl",
            category: "$productDetails.category",
          },
          wishlistCount: 1,
          latestWishlist: 1,
          recentUsers: {
            $slice: [
              {
                $map: {
                  input: "$userDetails",
                  as: "user",
                  in: {
                    id: "$$user._id",
                    name: "$$user.name",
                    email: "$$user.email",
                    profileImage: "$$user.profileImage",
                  },
                },
              },
              5, // Show only 5 recent users
            ],
          },
          totalUsers: { $size: "$users" },
        },
      },
      {
        $sort: { wishlistCount: -1, latestWishlist: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const totalProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: "$product",
        },
      },
      {
        $count: "total",
      },
    ]);

    const total = totalProducts[0]?.total || 0;

    res.status(200).json({
      success: true,
      products: wishlistedProducts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching most wishlisted products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most wishlisted products",
      error: error.message,
    });
  }
};

// Delete a wishlist entry
export const deleteWishlist = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedWishlist = await Wishlist.findByIdAndDelete(id);

    if (!deletedWishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Wishlist entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete wishlist",
      error: error.message,
    });
  }
};