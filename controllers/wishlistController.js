//Handles products CRUD operations
import Product from '../models/ProductModel.js';
import User from '../models/User.js';
import Wishlist from '../models/WishlistModel.js'

export async function AddToWishlistProducts(req, res) { 
   const { userId, productId } = req.body;

  try {
    const existing = await Wishlist.findOne({ user: userId, product: productId });

    if (existing) {
      return res.json({ status: 'already in wishlist' });
    } else {
      await Wishlist.create({ user: userId, product: productId });
      await Product.findByIdAndUpdate(productId, { $inc: { wishlistsCount: 1 } });
      return res.json({ status: 'added' });
    }
  } catch (error) {
    console.error("Error in adding product to wishlist:", error);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function RemoveFromWishlistProducts(req, res) {
  const { userId, productId } = req.body;

  try {
    const existing = await Wishlist.findOne({ user: userId, product: productId });

    if (!existing) {
      return res.json({ status: 'not in wishlist' });
    } else {
      await Wishlist.deleteOne({ _id: existing._id });
      await Product.findByIdAndUpdate(productId, { $inc: { wishlistsCount: -1 } });
      return res.json({ status: 'removed' });
    }
  } catch (error) {
    console.error("Error in removing product from wishlist:", error);
    res.status(500).json({ error: 'Server error' });
  }
}


export async function getWishlistOfOneUser(req, res) { 
    //console.log("Wishlist get called")
    try {
    const items = await Wishlist.find({ user: req.params.userId }).populate('product');
    res.json(items);
    } catch (error) {
    console.error("Wishlist Fetch Error:", error);
    res.status(500).json({ error: 'Server error' });
    }
}
