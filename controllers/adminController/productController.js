import Product from '../../models/ProductModel.js';


export async function getAllProductsForAdmin(req, res) {
    try {
        // Fetch all products and count the total number
        const products = await Product.find().sort({ createdAt: -1 });
       
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