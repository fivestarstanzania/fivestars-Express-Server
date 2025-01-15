//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
 
import  cloudinary  from '../utils/cloudinary.js';
export async function createProduct(req, res) {
    const senderId = req.user._id;
    const { name, description, price, image, category } = req.body;
    try {
        // Ensure an image is uploaded
        if (!image) {
            return res.status(400).json({ message: "No image file uploaded." });
        }

        // Upload image to Cloudinary
        //const imageFile = req.file.path; // This is the uploaded image file from the FormData
        const result = await cloudinary.uploader.upload(image, {
            folder:'products'
        });

        const newProduct = new Product({
            uploadedBy:senderId,
            title: name,
            description,
            price,
            imageUrl: result.secure_url, // Save Cloudinary image URL in MongoDB
            category
        });

        await newProduct.save();
        console.log('the product created success')
        res.status(200).json({ message: 'Product created successfully', newProduct });
    } catch (error) {
        console.error("Error creating product: ", error, req.body);
        res.status(500).json({ message: "Failed to create the product", error: error.message });
    }
}
export async function getAllProducts(req, res) {

    try {
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

        console.log(responseData)

        // Send the response
        res.status(200).json(responseData);

        
    } catch (error) {
        res.status(500).json("Failed to get all the product");
    }
}
export async function searchProduct(req, res) {

    try {
        const key = req.params.key;
        console.log("Search key received:", key);
        console.log(key)
        const result = await Product.find({ $text: { $search: key } });
        console.log("hello")
        console.log(result)
        res.json(result);
            
    } catch (error) {
        res.status(500).json("Failed to get the product");
    }
}
export async function getCategoryProduct(req,res) {
    console.log("category product is being search")
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

      const products = await Product.find({ uploadedBy });

      res.status(200).json( products );
      //console.log(products)
    } catch (error) {
      console.error('Error fetching seller products:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    };
};

