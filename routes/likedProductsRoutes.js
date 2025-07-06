import express from 'express';
import { getLikedProductsOfOneUser, toggleLikedProducts } from '../controllers/likedProductsController.js';

const router = express.Router();

router.get('/:userId', getLikedProductsOfOneUser); 

router.post('/toggle', toggleLikedProducts);
export default router;
 