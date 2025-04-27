//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
import Seller from '../models/sellerModel.js'
 
import  {cloudinary}  from '../utils/cloudinary.js';
import { isSellerBanned } from '../utils/isSellerBanned.js';
export async function createProduct(req, res) { 
    const files = req.files || [req.file].filter(Boolean); // Handle both formats
    try {
        const userId = req.user._id;
        const { 
            description, 
            price,  
            category, 
            title,
            subcategory, 
            quantity,
            deliveryOption,
            specifications,
            returnPolicy
        } = req.body;

        const files = req.files || [req.file].filter(Boolean);
        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No image file uploaded." });
        }
        if (files.length > 4) {
            return res.status(400).json({ message: "Maximum 4 images allowed per product." });
        }
        const seller = await Seller.findOne({userId});
        if (!seller) {
            return res.status(404).json({ message: "Seller not found." });
        }
        const sellerId = seller._id;
        if(await isSellerBanned(sellerId)){
            return res.status(403).json({ message: "You are banned from adding products." });
        }
        const productCount = await Product.countDocuments({sellerId});
        //const maxProductAllowed = 10;
        
        const maxSellerProductAllowed = seller.uploadLimit
        //console.log("max allowed products are:", maxSellerProductAllowed)
        if (productCount >= maxSellerProductAllowed){
            return res.status(403).json({message:`Product limit reached. You can only upload up to ${maxSellerProductAllowed} products.`})
        }
        
        // Upload all images to Cloudinary
        const uploadPromises = files.map(file => {
            const b64 = Buffer.from(file.buffer).toString("base64");
            const dataURI = `data:${file.mimetype};base64,${b64}`;
            return cloudinary.uploader.upload(dataURI, {
                folder:'products',
                quality: 'auto',
                fetch_format: 'auto',
                width: 800,
                crop: 'limit',
                format: 'webp'
            });
        });
        const results = await Promise.all(uploadPromises);
        const imageUrls = results.map(result => result.secure_url);
        const imageUrl = imageUrls[0];

        //console.log("i got called3")
        const newProduct = new Product({
            userId,
            description,
            price: Number(price),
            title,
            imageUrl, 
            imageUrls,
            category,
            subcategory,
            sellerId,
            quantity: Number(quantity),
            deliveryOption,
            returnPolicy,
            specifications: JSON.parse(specifications)
        });
        //console.log("i got called4")
        await newProduct.save();
        //console.log('the product created success')
        //console.log("i got called5")
        res.status(200).json({ message: 'Product created successfully', newProduct });
    } catch (error) {
        console.error("Error creating product: ", error, req.body);
        res.status(500).json({ message: "Failed to create the product", error: error.message });
    }
}

export async function updateProduct(req, res) {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;
        
        // Only extract allowed fields from request body
        const { 
            title, 
            price, 
            description, 
            quantity 
        } = req.body;

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
        if (quantity !== undefined) updates.quantity = Number(quantity);
        
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

export async function getAllProducts(req, res) {

    try {
       /* const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments()
        ]);

        res.status(200).json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
        */
        const unfilteredProducts = await Product.find().sort({ createdAt: -1 });
        const products = unfilteredProducts.filter(product => product.sellerStatus !== "Banned");

        res.status(200).json(products);
        //console.log(products)
    } catch (error) {
        res.status(500).json("Failed to get the products");
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
        if (!searchTerm || searchTerm.length < 2) {
            return res.status(400).json({ 
                message: "Search term must be at least 2 characters long" 
            });
        }

        // Search products with text index and filter banned sellers in single query
        const products = await Product.find({
            $and: [
                { $text: { $search: searchTerm } },
                { sellerStatus: { $ne: "Banned" } } // Filter by sellerStatus in Product
            ]
        })
        .populate({
            path: 'sellerId',
            select: 'name activityStatus', // Only get necessary fields
            match: { activityStatus: { $ne: "Banned" } } // Ensure populated sellers aren't banned
        })
        .lean(); // Convert to plain JS object

        if (products.length === 0) {
            return res.status(404).json({ 
                message: "No products found matching your search",
                suggestions: ["Try different keywords", "Check your spelling"]
            });
        }

        res.json(products);

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

        const publicId = product.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);

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
        const { userId } = req.query;
        //console.log("userId:",userId) 
        if (!userId) {
            return res.status(400).json({ error: 'Seller user ID is required' });
        }
        
        const seller = await  Seller.findOne({userId}).select('activityStatus');
        //console.log("text1") 
        if(!seller){
            return res.status(404).json({ message: "Seller with that userId not found" });
        }

        if (seller?.activityStatus === "Banned") {
            return res.status(403).json({ error: 'This seller account is banned' });
        }
        //console.log("text2")
        const sellerId = seller._id;

        const products = await Product.find({ sellerId })
        .sort({ createdAt: -1 })
        .lean();
        //console.log("text3")
        res.status(200).json(products);
        //console.log(products)
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


