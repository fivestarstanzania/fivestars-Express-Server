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
    console.error("Error creating product: ", error, req.body);
    res.status(500).json({ message: "Failed to create the product", error: error.message });
  }
}

export async function updateProduct(req, res) {
  console.log("in the updating started");
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
            returnPolicy

        } = req.body;
        console.log("body:", req.body)

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

// controllers/productController.js
export async function getAllProducts(req, res) {
  try {
    const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : null;
    const limit = req.query.limit ? Math.min(48, parseInt(req.query.limit)) : null;

    const filter = { sellerStatus: { $ne: "Banned" } };

    if (!page || !limit) {
      // OLD APP → return full list
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .select("title price regularPrice imageUrl description createdAt")
        .lean();
      return res.status(200).json({
        products,
        total: products.length,
        pagination: false,
      });
    }

    // NEW APP → paginated
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title price regularPrice imageUrl description createdAt")
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      pagination: true,
    });
  } catch (error) {
    console.error("getAllProducts error:", error);
    res.status(500).json({ message: "Failed to get the products" });
  }
}


export async function getProduct(req, res) {

    try {
        // 1. Find product with populated seller
        const product = await Product.findById(req.params.id)
            .populate("sellerId", "activityStatus") // Only populate necessary fields
            .lean(); // Convert to plain JS object for better performance

        // 2. Validate product and seller status
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        if (product.sellerId?.activityStatus === "Banned") {
            return res.status(403).json({ message: "This product is unavailable because the seller is banned" });
        }

        // 3. Get additional seller info
        const seller = await Seller.findById(product.sellerId)
            .select("businessName") // Only get the name field
            .lean();

        if (!seller) {
            return res.status(404).json({ message: "Seller information not available" });
        }



        // Construct the final response
        const responseData = {
            product,
            sellerName: seller.businessName
        };

        //console.log(product)
        // Send the response
        res.status(200).json(responseData);

        
    } catch (error) {
        res.status(500).json("Failed to get all the product");
    }
}

export async function searchProduct(req, res) {
    try {
        const searchTerm = req.params.key.trim(); // Trim whitespace from search term
        //console.log("search term:", searchTerm)
        if (!searchTerm || searchTerm.length < 1) {
            return res.status(400).json({ 
                message: "Search term must be at least 2 characters long" 
            });
        }

        // Search products with text index and filter banned sellers in single query
        const products = await Product.find({
            $and: [
                { title: { $regex: new RegExp(searchTerm, 'i') } },
                { sellerStatus: { $ne: "Banned" } } // Filter by sellerStatus in Product
            ]
        })
        .populate({
            path: 'sellerId',
            select: 'name activityStatus', // Only get necessary fields
            match: { activityStatus: { $ne: "Banned" } } // Ensure populated sellers aren't banned
        })
        .lean(); // Convert to plain JS object

       
        // Remove products with no seller (e.g., seller was banned and not populated)
        const validProducts = products.filter((p) => p.sellerId);

         // ✅ Log the search
        await SearchLog.create({
            keyword: searchTerm,
            resultsFound: validProducts.length,
            userId: req.user?._id || null, // Capture if user is logged in
        });
        
        if (validProducts.length === 0) {
            return res.status(200).json({ 
                products: [],
                message: "No products found matching your search",
                suggestions: ["Try different keywords", "Check your spelling"]
            });
        }

        res.json(validProducts);

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ 
            message: "An error occurred during search",
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message 
            })
        });
    }
}


export async function getCategoryProduct(req,res) {
    try {
        const { category } = req.query;
        
        if (!category) {
            return res.status(400).json({ error: "Category parameter is required" });
        }

        const products = await Product.find({ 
            category,
            'sellerId.activityStatus': { $ne: "Banned" } 
        })
        .populate({
            path: 'sellerId',
            select: 'name activityStatus',
            match: { activityStatus: { $ne: "Banned" } }
        })
        .sort({ createdAt: -1 })
        .lean();

        const validProducts = products.filter(product => product.sellerId);

        res.json(validProducts);
    } catch (error) {
        console.error("Category product error:", error);
        res.status(500).json({ 
            error: "Failed to fetch products",
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
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


// Fetch products by seller ID
export async function getSellerProducts(req, res) {
  try {
    const { userId, page, limit, search = "" } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Seller user ID is required' });
    }

    const seller = await Seller.findOne({ userId }).select('activityStatus');
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller.activityStatus === "Banned")
      return res.status(403).json({ error: 'This seller account is banned' });

    const sellerId = seller._id;

    // Build query with optional search
    let query = { sellerId };
    if (search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // If no page/limit → return all products (OLD APP)
    if (!page || !limit) {
      const products = await Product.find(query).sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        products,
        totalProducts: products.length,
        pagination: false,
      });
    }

    // NEW APP → paginated
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      products,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      pagination: true,
    });

  } catch (error) {
    console.error('Seller products error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

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

// Get all discounted products (full list)
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

    const matchQuery = {
      regularPrice: { $exists: true, $ne: null },
      price: { $exists: true, $ne: null },
      sellerStatus: "Active",
    };

    if (category && category !== "all") {
      matchQuery.category = category;
    }

    const pipeline = [
      { $match: matchQuery },

      // Convert prices safely
      {
        $addFields: {
          regularPriceNum: {
            $cond: [
              { $not: ["$regularPrice"] },
              0,
              { $toDouble: "$regularPrice" }
            ]
          },
          priceNum: {
            $cond: [
              { $not: ["$price"] },
              0,
              { $toDouble: "$price" }
            ]
          }
        }
      },

      // Only discounted items
      {
        $match: {
          $expr: { $gt: ["$regularPriceNum", "$priceNum"] }
        }
      },

      // Compute discount
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

    // Sorting
    pipeline.push(
      sortBy === "recent"
        ? { $sort: { createdAt: -1 } }
        : { $sort: { discountPercentage: -1, createdAt: -1 } }
    );

    // Pagination
    pipeline.push({ $skip: skip }, { $limit: perPage });

    // Project final fields
    pipeline.push({
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

    const discountedProducts = await Product.aggregate(pipeline);
    const totalProducts = await Product.countDocuments(matchQuery);

    return res.status(200).json({
      success: true,
      data: discountedProducts,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalProducts / perPage),
        totalProducts,
        hasMore: skip + perPage < totalProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching discounted products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch discounted products",
    });
  }
};


// Get all discounted products (for home screen - limited)
// Get all discounted products (home screen - limited)
export const getLimitedDiscountedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const discountedProducts = await Product.aggregate([
      {
        $match: {
          regularPrice: { $exists: true, $ne: null },
          price: { $exists: true, $ne: null },
          sellerStatus: "Active"
        }
      },
      {
        // Convert price fields to numbers ALWAYS
        $addFields: {
          regularPriceNum: { $toDouble: "$regularPrice" },
          priceNum: { $toDouble: "$price" }
        }
      },
      {
        // Only keep products where regularPrice > price
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
      {
        $sort: {
          discountPercentage: -1,
          createdAt: -1
        }
      },
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
    ]);

    res.status(200).json({
      success: true,
      data: discountedProducts
    });
  } catch (error) {
    console.error("Error fetching limited discounted products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch limited discounted products"
    });
  }
};

