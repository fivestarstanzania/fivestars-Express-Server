import Product from '../../models/ProductModel.js';
import sellerModel from '../../models/sellerModel.js';

export async function getAllProductsForAdmin(req, res) {
    try {
        // Fetch all products and count the total number
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .populate("sellerId", "name businessName");
        
       
        const totalProducts = await Product.countDocuments();

        // Respond with both the total number and the products
        res.status(200).json({
            total: totalProducts,
            products: products,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to get the products" });
    }
}

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

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('sellerId', 'name businessName email phone')
      .select('-userId'); // Exclude userId from response

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }


    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(req.body);
    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Find existing product
    const product = await Product.findById(id).populate(
      "sellerId",
      "name businessName email phone"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Cleaned + sanitized fields from middleware
    const data = req.cleanedData;

    // No valid data to update
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    // ----------------------------
    // Price Relationship Validation
    // ----------------------------
    const newPrice = data.price ?? product.price;
    const newRegular = data.regularPrice ?? product.regularPrice;
    const newWholesale = data.wholesalePrice ?? product.wholesalePrice;

    if (data.price !== undefined && newPrice < 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }

    if (data.regularPrice !== undefined && newRegular < 0) {
      return res.status(400).json({ message: "Regular price must be positive" });
    }

    if (newPrice > newRegular) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be higher than regular price"
      });
    }

    if (newWholesale >= newRegular) {
      return res.status(400).json({
        success: false,
        message: "Wholesale price must be less than regular price"
      });
    }

    // -------------------------------------
    // Discount Calculation
    // -------------------------------------
    if (data.price !== undefined || data.regularPrice !== undefined) {
      if (newRegular > newPrice) {
        data.discountPercentage = Math.round(((newRegular - newPrice) / newRegular) * 100);
        data.discountedPrice = newPrice;
      } else {
        data.discountPercentage = null;
        data.discountedPrice = null;
      }
    }

    // Track who updated it
    // data.updatedBy = req.user.id;

    // Update document
    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      {
        new: true,
        runValidators: true,
        context: "query"
      }
    ).populate("sellerId", "name businessName email phone supplierName supplierContat");

    res.status(200).json({
      success: true,
      product: updated,
      message: "Product updated successfully"
    });

  } catch (error) {
    console.error("Error updating product:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating product"
    });
  }
};


