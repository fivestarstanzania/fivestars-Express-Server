//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
import Seller from '../models/sellerModel.js';
import SearchLog from '../models/SearchLog.js';
import ProductClickLog from '../models/ProductClickLog.js';
import  {cloudinary}  from '../utils/cloudinary.js';
import { isSellerBanned } from '../utils/isSellerBanned.js';
import streamifier from 'streamifier';
import pLimit from 'p-limit';


// Helper: check whether request included pagination params explicitly
function hasPaginationParams(req) {
  // require BOTH page and limit to be present in the query string
  return Object.prototype.hasOwnProperty.call(req.query, 'page') &&
         Object.prototype.hasOwnProperty.call(req.query, 'limit');
}

const getActiveNonBannedPipeline = () => [
  {
    $lookup: {
      from: "sellers",          // MongoDB collection name for Seller model
      localField: "sellerId",
      foreignField: "_id",
      as: "sellerInfo"
    }
  },
  { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: false } },
  {
    $match: {
      isActive: { $ne: false }, // treat missing isActive (old products) as active
      "sellerInfo.activityStatus": { $ne: "Banned" }
    }
  }
];



export async function createProduct(req, res) {
  console.log("in the uploading started");

  try {
    const userId = req.user._id;
    const {
      description,
      price,
      regularPrice,
      wholesalePrice,
      supplierName,
      supplierContat,
      category,
      title,
      subcategory,
      specifications,
      returnPolicy
    } = req.body;

    // single canonical files variable
    const files = (req.files && req.files.length) ? req.files : (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No image file uploaded." });
    }
    if (files.length > 4) {
      return res.status(400).json({ message: "Maximum 4 images allowed per product." });
    }

    console.log("STEP 1: Validating Seller...");
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: "Seller not found." });

    const sellerId = seller._id;
    if (await isSellerBanned(sellerId)) {
      return res.status(403).json({ message: "You are banned from adding products." });
    }

    const productCount = await Product.countDocuments({ sellerId });
    const maxSellerProductAllowed = seller.uploadLimit || 10;
    if (productCount >= maxSellerProductAllowed) {
      return res.status(403).json({ message: `Product limit reached. You can only upload up to ${maxSellerProductAllowed} products.` });
    }

    console.log("Uploading images to Cloudinary...");
    const uploadStreamPromise = (file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            quality: "auto",
            fetch_format: "auto",
            width: 800,
            crop: "limit",
            format: "webp"
            // note: cloudinary uploader options vary by SDK/version — remove unsupported options if errors occur
          },
          (error, result) => {
            if (error) {
              console.log("Cloudinary ERROR:", error);
              return reject(error);
            }
            resolve(result);
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });

    const limit = pLimit(2); // concurrency 2
    const uploadPromises = files.map((file, index) => {
      console.log(`Queued upload ${index + 1}/${files.length}`);
      return limit(() => uploadStreamPromise(file));
    });

    // <- THE KEY: wait for all uploads to finish
    let results;
    try {
      results = await Promise.all(uploadPromises);
      console.log("All images uploaded successfully.");
    } catch (cloudError) {
      console.log("ERROR: Cloudinary upload failed →", cloudError);
      return res.status(500).json({
        message: "Failed to upload images to Cloudinary.",
        error: cloudError.message || cloudError
      });
    }

    const imageUrls = results.map(r => r.secure_url);
    const imageUrl = imageUrls[0];

    // validate numeric prices
    const parsedPrice = Number(price);
    const parsedRegularPrice = regularPrice ? Number(regularPrice) : undefined;
    const parsedWholesalePrice = wholesalePrice ? Number(wholesalePrice) : undefined;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Please enter a valid price." });
    }
    if (regularPrice && isNaN(parsedRegularPrice)) {
      return res.status(400).json({ message: "Regular price must be a valid number." });
    }
    if (wholesalePrice && isNaN(parsedWholesalePrice)) {
      return res.status(400).json({ message: "Wholesale price must be a valid number." });
    }

    // parse specifications safely
    let specsParsed = {};
    if (specifications) {
      try {
        specsParsed = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
      } catch (parseErr) {
        return res.status(400).json({ message: "Invalid specifications JSON." });
      }
    }

    console.log("creating new product document");
    const newProduct = new Product({
      userId,
      description,
      price: parsedPrice,
      regularPrice: parsedRegularPrice,
      wholesalePrice: parsedWholesalePrice,
      supplierName: supplierName?.trim(),
      supplierContat: supplierContat?.trim(),
      title,
      imageUrl,
      imageUrls,
      category,
      subcategory,
      sellerId,
      returnPolicy,
      specifications: specsParsed
    });

    await newProduct.save();
    console.log("the product created success");
    res.status(200).json({ message: "Product created successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Failed to create the product", error: error.message });
  }
}
export async function updateProduct(req, res) {
    //console.log("in the updating started");
    try {
        const userId = req.user._id;
        const productId = req.params.productId;
        console.log("productId:", productId)
        // Only extract allowed fields from request body
        const { 
            title, 
            price, 
            description, 
            regularPrice, 
            wholesalePrice,
            supplierName,
            supplierContat,
            returnPolicy,
            isActive

        } = req.body;
        //console.log("body:", req.body)

        // 1. Verify product exists and belongs to seller
        const product = await Product.findOne({ _id: productId, userId });
        if (!product) {
            return res.status(404).json({ message: "Product not found or unauthorized." });
        }

        // 2. Prepare update object with only allowed fields
        const updates = {};
        
        if (title !== undefined) updates.title = title;
        if (price !== undefined) updates.price = Number(price);
        if (description !== undefined) updates.description = description;
        if (regularPrice !== undefined) updates.regularPrice = Number(regularPrice);
        if (wholesalePrice !== undefined) updates.wholesalePrice = Number(wholesalePrice);
        if (supplierName !== undefined) updates.supplierName = supplierName.trim();
        if (supplierContat !== undefined) updates.supplierContat = supplierContat.trim();
        if (returnPolicy !== undefined) updates.returnPolicy = returnPolicy;
        if (isActive !== undefined) updates.isActive = isActive;      // boolean field




        // Add update timestamp
        updates.updatedAt = new Date();

        // 3. Update only if there are valid changes
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update." });
        }

        // 4. Perform the update
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { new: true } // Return the updated document
        );

        res.status(200).json({ 
            message: 'Product updated successfully', 
            product: updatedProduct 
        });

    } catch (error) {
        console.error("Error updating product: ", error);
        res.status(500).json({ 
            message: "Failed to update the product", 
            error: error.message 
        });
    }
}
// Edit a product
export async function editProduct(req, res) {
    try {
        const { productId, name, description, price } = req.body;

        const product = await Product.findById(productId)
            .populate('sellerId', 'activityStatus');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.sellerId?.activityStatus === "Banned") {
            return res.status(403).json({ error: 'Cannot edit product from banned seller' });
        }

        product.name = name;
        product.description = description;
        product.price = price;
        
        await product.save();

        res.status(200).json({ 
            message: 'Product updated successfully!', 
            product: {
                id: product._id,
                name: product.name,
                price: product.price,
                description: product.description
            }
        });
    } catch (error) {
        console.error("Edit product error:", error);
        res.status(500).json({ 
            error: 'Error updating product',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
}
// Delete a product
export async function deleteProduct(req, res){
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('sellerId', 'activityStatus');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.sellerId?.activityStatus === "Banned") {
            return res.status(403).json({ error: 'Cannot delete product from banned seller' });
        }

        // Helper to extract full Cloudinary public_id
        // Extract Cloudinary public_id correctly
        const getPublicId = (url) => {
            if (!url) return null;

            const cleanUrl = url.split("?")[0]; // remove any query params
            const match = cleanUrl.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);

            // match[1] = folder/filename WITHOUT extension → correct Cloudinary public_id
            return match ? match[1] : null;
        };

        const images = product.imageUrls || [];

        // Delete all Cloudinary images for this product
        const deletionPromises = images.map((url) => {
            const publicId = getPublicId(url);

            if (!publicId) {
                console.log("⚠️ Could not extract public_id from:", url);
                return null;
            }

            return cloudinary.uploader.destroy(publicId)
                .then(result => console.log("✔ Deleted:", publicId))
                .catch(err => console.log("❌ Cloudinary delete error:", err.message));
        });

        await Promise.all(deletionPromises);
        // Delete product from DB
        await Product.deleteOne({ _id: productId });
        res.status(200).json({ 
            message: 'Product deleted successfully!' 
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ 
            error: 'Error deleting product',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
};
export async function createLogClickedProducts(req, res) {
    try {
    const { productId, productTitle, userId, source } = req.body;

    if (!productId || !productTitle) {
      return res.status(400).json({ message: "Missing product info" });
    }

    await ProductClickLog.create({
      productId,
      productTitle,
      userId: userId || null,
      source: source || "other",
    });

    // Optional: increase product click count
    await Product.findByIdAndUpdate(productId, { $inc: { clickCount: 1 } });

    res.status(201).json({ message: "Click logged successfully" });
  } catch (error) {
    console.error("Error logging product click:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}






// controllers/productController.js
export async function getAllProducts(req, res) {
  try {
    const isPaginatedRequest = hasPaginationParams(req);
    const page = isPaginatedRequest ? Math.max(1, parseInt(req.query.page) || 1) : null;
    const limit = isPaginatedRequest ? Math.min(48, parseInt(req.query.limit) || 12) : null;
    const pipeline = [
      ...getActiveNonBannedPipeline(),
      { $sort: { createdAt: -1 } }
    ];


    
    if (!isPaginatedRequest) {
      // OLD APP → return FULL LIST as a plain array (same shape old clients expect)
      const products = await Product.aggregate(pipeline);
      return res.status(200).json(products); // plain array response
    }

    // NEW APP → paginated response
    const skip = (page - 1) * limit;
    const [products, totalResult] = await Promise.all([
      Product.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
        { $project: { title: 1, price: 1, regularPrice: 1, imageUrl: 1, description: 1, createdAt: 1 } }
      ]),
      Product.aggregate([...getActiveNonBannedPipeline(), { $count: "total" }])
    ]);

    const total = totalResult[0]?.total || 0;

    return res.status(200).json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("getAllProducts error:", error);
    return res.status(500).json({ message: "Failed to get the products" });
  }
}

export async function getProduct(req, res) {

    try {
        // 1. Find product with populated seller
        const product = await Product.findById(req.params.id)
            .populate({
              path: "sellerId",
              match: { activityStatus: { $ne: "Banned" } }, // Only populate if seller is not banned
              select: "activityStatus businessName" // Only get necessary fields
            })
            .lean(); // Convert to plain JS object for better performance

        // 2. Validate product and seller status
        if (!product || !product.sellerId || product.isActive === false) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        if (product.sellerId?.activityStatus === "Banned") {
            return res.status(403).json({ message: "This product is unavailable because the seller is banned" });
        }

        // 3. Get additional seller info
        const seller = await Seller.findById(product.sellerId._id)
            .select("businessName") // Only get the name field
            .lean();

        if (!seller) {
            return res.status(404).json({ message: "Seller information not available" });
        }



        // Construct the final response
        const responseData = {
            product,
            sellerName: seller?.businessName
        };

        //console.log(product)
        // Send the response
        res.status(200).json(responseData);

        
    } catch (error) {
        res.status(500).json("Failed to get all the product");
    }
}

// Seller-specific: fetch own product by ID regardless of isActive status (for editing)
export async function getSellerProductById(req, res) {
    try {
        const userId = req.user._id;

        // Find the seller record for the authenticated user
        const seller = await Seller.findOne({ userId }).select('_id activityStatus').lean();
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }
        if (seller.activityStatus === "Banned") {
            return res.status(403).json({ message: "Your seller account is banned" });
        }

        // Fetch the product; verify it belongs to this seller (no isActive filter)
        const product = await Product.findOne({ _id: req.params.id, sellerId: seller._id }).lean();
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ product });
    } catch (error) {
        console.error("getSellerProductById error:", error);
        res.status(500).json({ message: "Failed to get product" });
    }
}

export async function searchProduct(req, res) {
  try {
    const searchTerm = req.params.key.trim();
    if (!searchTerm || searchTerm.length < 1) {
      return res.status(400).json({ message: "Search term too short" });
    }

    const { minPrice, maxPrice, category, sort = "recent" } = req.query;

    // Build match conditions after $lookup
    const matchConditions = {
      isActive: true,
      "sellerInfo.activityStatus": { $ne: "Banned" },
      title: { $regex: new RegExp(searchTerm, 'i') }
    };
    if (minPrice || maxPrice) {
      matchConditions.price = {};
      if (minPrice) matchConditions.price.$gte = Number(minPrice);
      if (maxPrice) matchConditions.price.$lte = Number(maxPrice);
    }
    if (category && category !== "all") {
      matchConditions.category = category;
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case "price_asc": sortOption = { price: 1 }; break;
      case "price_desc": sortOption = { price: -1 }; break;
      case "popular": sortOption = { clickCount: -1 }; break;
      case "discount_desc": sortOption = { discountPercentage: -1 }; break;
      default: sortOption = { createdAt: -1 }; // recent
    }

    const pipeline = [
      ...getActiveNonBannedPipeline(),
      { $match: matchConditions },
      { $sort: sortOption },
    ];

    const products = await Product.aggregate(pipeline);
    await SearchLog.create({ keyword: searchTerm, resultsFound: products.length, userId: req.user?._id });

    res.json(products);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed" });
  }
}

export async function getCategoryProduct(req, res) {
  try {
    const { category, search = "", minPrice, maxPrice, sort = "recent" } = req.query;
    if (!category) return res.status(400).json({ error: "Category required" });

    const matchConditions = {
      isActive: true,
      "sellerInfo.activityStatus": { $ne: "Banned" },
      category
    };
    if (search.trim()) {
      matchConditions.title = { $regex: new RegExp(search, 'i') };
    }
    if (minPrice || maxPrice) {
      matchConditions.price = {};
      if (minPrice) matchConditions.price.$gte = Number(minPrice);
      if (maxPrice) matchConditions.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case "price_asc": sortOption = { price: 1 }; break;
      case "price_desc": sortOption = { price: -1 }; break;
      case "popular": sortOption = { clickCount: -1 }; break;
      case "discount_desc": sortOption = { discountPercentage: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }


    const pipeline = [
      ...getActiveNonBannedPipeline(),
      { $match: matchConditions },
      { $sort: sortOption },
    ];
    
    const products = await Product.aggregate(pipeline);
    res.json(products);
  } catch (error) {
    console.error("Category product error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

// Get all discounted products (full list)
export const getDiscountedProducts = async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      sortBy = "discount", // 'discount' or 'recent'
      category,
    } = req.query;

    const perPage = parseInt(limit);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * perPage;

    //start with base pipeline to filter active, non-banned sellers
    const basePipeline = getActiveNonBannedPipeline();

    //add discount calculation and filtering stages
    const discountPipeline = [
      ...basePipeline,
      {
        $addFields: {
          regularPriceNum: {$toDouble: "$regularPrice"},
          priceNum: {$toDouble: "$price"}
        }
      },
        {
        $match: {
          $expr: { $gt: ["$regularPriceNum", "$priceNum"] }
        }
      },
      {
        $addFields: {
          discountAmount: { $subtract: ["$regularPriceNum", "$priceNum"] },
          discountPercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$regularPriceNum", "$priceNum"] },
                      "$regularPriceNum",
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ];

    if (category && category !== "all") {
      discountPipeline.push({ $match: { category } });
    }

    //sorting
    discountPipeline.push(
      sortBy === "recent"
        ? { $sort: { createdAt: -1 } }
        : { $sort: { discountPercentage: -1, createdAt: -1 } }
    );

    //pagination
    discountPipeline.push({ $skip: skip }, { $limit: perPage });

    //project final fields
    discountPipeline.push({
      $project: {
        _id: 1,
        title: 1,
        imageUrl: 1,
        imageUrls: 1,
        price: "$priceNum",
        regularPrice: "$regularPriceNum",
        discountAmount: 1,
        discountPercentage: 1,
        category: 1,
        description: 1,
        createdAt: 1,
      },
    });

    const discountedProducts = await Product.aggregate(discountPipeline);

    // For total count, we can run a simpler pipeline without pagination
    const countPipeline = [
      ...basePipeline.slice(0, -3), // remove the last 3 stages $skip, $limit, $project
      { $count: "total" }
    ];
    const totalResult = await Product.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;
    
    return res.status(200).json({
      success: true,
      data: discountedProducts,
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / perPage),
        totalProducts: total,
        hasMore: skip + perPage < total,
      },
    });
  } catch (error) {
    console.error("Error fetching discounted products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch discounted products",
      ...(process.env.NODE_ENV === "development" && { details: error.message }),
    });
  }
};

// Get all discounted products (home screen - limited)
export const getLimitedDiscountedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const pipeline = [
      ...getActiveNonBannedPipeline(),
      {
        $addFields: {
          regularPriceNum: { $toDouble: "$regularPrice" },
          priceNum: { $toDouble: "$price" }
        }
      },
      {
        $match: {
          $expr: { $gt: ["$regularPriceNum", "$priceNum"] }
        }
      },
      {
        $addFields: {
          discountAmount: { $subtract: ["$regularPriceNum", "$priceNum"] },
          discountPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $subtract: ["$regularPriceNum", "$priceNum"] }, "$regularPriceNum"] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { discountPercentage: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          imageUrl: 1,
          imageUrls: 1,
          price: "$priceNum",
          regularPrice: "$regularPriceNum",
          discountAmount: 1,
          discountPercentage: 1,
          category: 1,
          description: 1,
          createdAt: 1,
          clickCount: 1
        }
      }
    ];

    const discountedProducts = await Product.aggregate(pipeline);
    res.status(200).json({ success: true, data: discountedProducts });
  } catch (error) {
    console.error("Error fetching limited discounted products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch limited discounted products" });
  }
};

// Get latest products from last 30 days (paginated)
export const getLatestProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pipeline = [
      ...getActiveNonBannedPipeline(),
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const [products, totalResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate([
        ...getActiveNonBannedPipeline(),
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $count: "total" }
      ])
    ]);

    const total = totalResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error("Error fetching latest products:", error);
    res.status(500).json({ success: false, message: "Failed to fetch latest products" });
  }
};

// controllers/productController.js
export async function getAllProductIds(req, res) {
  try {
    const products = await Product.aggregate([
      ...getActiveNonBannedPipeline(),
      { $project: { _id: 1, createdAt: 1 } }
    ]);

    res.status(200).json({ ids: products.map(p => p._id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product IDs" });
  }
}

// controllers/productController.js
export async function getProductsByIds(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const products = await Product.find({ _id: { $in: ids }, isActive: true })
      .populate({
        path: 'sellerId',
        match: { activityStatus: { $ne: 'Banned' } }
      })
      .lean();

    const filteredProducts = products.filter(product => product.sellerId);
    const productMap = new Map(filteredProducts.map(p => [p._id.toString(), p]));
    const ordered = ids.map(id => productMap.get(id.toString())).filter(Boolean);

    res.status(200).json({ products: ordered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch products by IDs" });
  }
}



// Fetch products by seller ID
export async function getSellerProducts(req, res) {
  try {
    const { userId, search = "", status, category, sort = "newest", page, limit } = req.query;
    if (!userId) return res.status(400).json({ error: 'Seller user ID required' });

    const seller = await Seller.findOne({ userId }).select('activityStatus');
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller.activityStatus === "Banned") return res.status(403).json({ error: 'Seller banned' });

    const sellerId = seller._id;
    let matchStage = { sellerId };

    if (search.trim()) {
      matchStage.title = { $regex: search, $options: 'i' };
    }
    if (status && status !== "all") {
      matchStage.isActive = status === "active";
    }
    if (category && category !== "all") {
      matchStage.category = category;
    }

    // Aggregation pipeline to add discountPercentage field
    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          discountPercentage: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$regularPrice", 0] },
                  { $gt: ["$price", 0] },
                  { $gt: ["$regularPrice", "$price"] }
                ]
              },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $subtract: ["$regularPrice", "$price"] }, "$regularPrice"] },
                      100
                    ]
                  },
                  0
                ]
              },
              else: 0
            }
          }
        }
      }
    ];

    // Sorting
    let sortStage = {};
    switch (sort) {
      case "mostViewed":
        sortStage = { clickCount: -1, _id: -1 };
        break;
      case "discount_desc":
        sortStage = { discountPercentage: -1, _id: -1 };
        break;
      case "oldest":
        sortStage = { createdAt: 1, _id: 1 };
        break;
      default: // "newest"
        sortStage = { createdAt: -1, _id: -1 };
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    const isPaginated = page && limit;
    if (!isPaginated) {
      const products = await Product.aggregate(pipeline);
      return res.json(products);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const facetPipeline = [
      ...pipeline,
      {
        $facet: {
          products: [{ $skip: skip }, { $limit: limitNum }],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await Product.aggregate(facetPipeline);
    const products = result[0]?.products || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    res.json({
      products,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
    });
  } catch (error) {
    console.error('Seller products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// Get total number of products for a specific user
export async function getUserProductCount(req, res) {
    try {
        const { sellerId } = req.query;

        if (!sellerId) {
            return res.status(400).json({ error: 'Seller ID is required' });
        }

        // Verify seller status first
        const seller = await User.findById(sellerId).select('activityStatus');
        if (!seller) {
            return res.status(404).json({ error: 'Seller not found' });
        }

        if (seller.activityStatus === "Banned") {
            return res.status(200).json({ 
                sellerId, 
                totalProducts: 0,
                message: 'Seller is banned' 
            });
        }

        const productCount = await Product.countDocuments({ userId: sellerId });

        res.status(200).json({ 
            sellerId, 
            totalProducts: productCount 
        });
    } catch (error) {
        console.error('Product count error:', error);
        res.status(500).json({ 
            error: 'Failed to get product count',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
}




