import express from 'express';
import { AddToWishlistProducts, getWishlistOfOneUser, RemoveFromWishlistItemById } from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/:userId', getWishlistOfOneUser); 

router.post('/add', AddToWishlistProducts);
router.delete('/remove/:id', RemoveFromWishlistItemById);
export default router;
 