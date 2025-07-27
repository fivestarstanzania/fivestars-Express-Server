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
    } 
    const newWishlistItem = new Wishlist({
      user: userId,
      product: productId,
    });

    await newWishlistItem.save();

    // Update wishlist count
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistsCount: 1 } });

    res.json({ status: 'added', wishlistItem: newWishlistItem });
  } catch (error) {
    console.error("Error in adding product to wishlist:", error);
    res.status(500).json({ error: 'Server error' });
  }
}

export async function RemoveFromWishlistItemById(req, res) {
  const { id } = req.params;

  try {
    const wishlistItem = await Wishlist.findById(id);
    
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    // Remove the wishlist item
    await Wishlist.deleteOne({ _id: id });

    // Decrement wishlist count if product exists
    if (wishlistItem.product) {
      await Product.findByIdAndUpdate(
        wishlistItem.product, 
        { $inc: { wishlistsCount: -1 } }
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error removing wishlist item by id:", error);
    res.status(500).json({ error: 'Server error' });
  }
}


export async function getWishlistOfOneUser(req, res) { 
  const userId = req.params.userId;

  try {
    const wishlist = await Wishlist.find({ user: userId })
      .populate({
        path: 'product',
        model: 'Product',
        options: { allowNull: true } // Handle deleted products
      });

    res.json(wishlist);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: 'Server error' });
  }
}
