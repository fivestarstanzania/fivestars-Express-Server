//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
import Seller from '../models/sellerModel.js'
 
import  cloudinary  from '../utils/cloudinary.js';
export async function createProduct(req, res) {
    const senderId = req.user._id;
    const { description, price, image, category, title } = req.body;
    try {
        const productCount = await Product.countDocuments({uploadedBy:senderId});
        //const maxProductAllowed = 10;
        const seller = await Seller.findOne({sellerId:senderId});
        if (!seller) {
            return res.status(404).json({ message: "Seller not found." });
        }

        
        const maxSellerProductAllowed = seller.uploadLimit
        //console.log("max allowed products are:", maxSellerProductAllowed)
        if (productCount >= maxSellerProductAllowed){
            return res.status(403).json({message:`Product limit reached. You can only upload up to ${maxSellerProductAllowed} products.`})
        }
        // Ensure an image is uploaded
        if (!image) {
            return res.status(400).json({ message: "No image file uploaded." });
        }

        // Upload image to Cloudinary
        //const imageFile = req.file.path; // This is the uploaded image file from the FormData
        const result = await cloudinary.uploader.upload(image, {
            folder:'products',
            quality: 'auto',
            fetch_format: 'auto',
            width: 800, // Max width for mobile
            crop: 'limit',
            format: 'webp' // Modern format
        });

        const newProduct = new Product({
            uploadedBy:senderId,
            description,
            price,
            title,
            imageUrl: result.secure_url, // Save Cloudinary image URL in MongoDB
            category
        });

        await newProduct.save();
        //console.log('the product created success')
        res.status(200).json({ message: 'Product created successfully', newProduct });
    } catch (error) {
        console.error("Error creating product: ", error, req.body);
        res.status(500).json({ message: "Failed to create the product", error: error.message });
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
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
        //console.log(products)
    } catch (error) {
        res.status(500).json("Failed to get the products");
    }
}
export async function getProduct(req, res) {

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            //console.log("product not found")
            return res.status(404).json({ message: "Product not found" });
            
        }
        // Extract the sellerId from the product document
        const sellerId = product.uploadedBy;

        // Find the user by sellerId
        const seller = await User.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        // Construct the final response
        const responseData = {
            product,
            sellerName: seller.name
        };

       

        // Send the response
        res.status(200).json(responseData);

        
    } catch (error) {
        res.status(500).json("Failed to get all the product");
    }
}
export async function searchProduct(req, res) {

    try {
        const key = req.params.key;
        const result = await Product.find({ $text: { $search: key } });
        res.json(result);
            
    } catch (error) {
        res.status(500).json("Failed to get the product");
    }
}
export async function getCategoryProduct(req,res) {
    //console.log("category product is being search")
    const { category } = req.query;
    try {
        const products = await Product.find({category});
        res.json( products );
    } catch (error) {

        res.status(500).json({ error: "Failed to fetch products" });
    }
}
// Edit a product
export async function editProduct(req, res){
    try {
      const { productId, name, description, price } = req.body;
  
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: 'Product not found' });
  
      product.name = name;
      product.description = description;
      product.price = price;
      await product.save();
  
      res.status(200).json({ message: 'Product updated successfully!', product });
    } catch (error) {
      res.status(500).json({ error: 'Error updating product' });
    }
};
// Delete a product
export async function deleteProduct(req, res){
  try {
    const { productId } = req.params;
    //console.log(productId)

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    //console.log("productFound")
    await Product.deleteOne({ _id: productId });
    //console.log("product deleted")
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
};

// Fetch products by seller ID
export async function getSellerProducts(req, res) {
    try {
      const { sellerId } = req.query; // Extract sellerId from query params
      const uploadedBy = sellerId
      if (!uploadedBy) {
        return res.status(400).json({ error: 'Seller ID is required' });
      }

      const products = await Product.find({ uploadedBy }).sort({createdAt: -1});

      res.status(200).json( products );
      //console.log(products)
    } catch (error) {
      console.error('Error fetching seller products:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    };
};

// Get total number of products for a specific user
export async function getUserProductCount(req, res) {
    try {
        const { sellerId } = req.query; // Extract sellerId from query params
        //console.log("sellerId",sellerId)
        if (!sellerId) {
            return res.status(400).json({ error: 'Seller ID is required' });
        }

        const productCount = await Product.countDocuments({ uploadedBy: sellerId });

        //console.log(productCount)
        res.status(200).json({ sellerId, totalProducts: productCount });
    } catch (error) {
        console.error('Error fetching product count:', error.message);
        res.status(500).json({ error: 'Failed to get product count' });
    }
}


