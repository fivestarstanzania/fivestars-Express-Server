import express from 'express';
import { AddToWishlistProducts, getWishlistOfOneUser, RemoveFromWishlistProducts } from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/:userId', getWishlistOfOneUser); 

router.post('/add', AddToWishlistProducts);
router.post('/remove', RemoveFromWishlistProducts);
export default router;
 