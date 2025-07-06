//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
import LikedProducts from '../models/LikedProducts.js';

export async function toggleLikedProducts(req, res) { 
   const { userId, productId } = req.body;

  try {
    const existing = await LikedProducts.findOne({ user: userId, product: productId });

    if (existing) {
      await LikedProducts.deleteOne({ _id: existing._id });
      await Product.findByIdAndUpdate(productId, { $inc: { likesCount: -1 } });
      return res.json({ status: 'removed' });
    } else {
      await LikedProducts.create({ user: userId, product: productId });
      await Product.findByIdAndUpdate(productId, { $inc: { likesCount: 1 } });
      return res.json({ status: 'added' });
    }
  } catch (error) {
    console.error("likes Toggle Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getLikedProductsOfOneUser(req, res) { 
    //console.log("LikedProducts get called")
    try {
    const items = await LikedProducts.find({ user: req.params.userId }).populate('product');
    res.json(items);
    } catch (error) {
    console.error("LikedProducts Fetch Error:", error);
    res.status(500).json({ error: 'Server error' });
    }
}
