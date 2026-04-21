import express from 'express';
import { AddToWishlistProducts, getWishlistOfOneUser, RemoveFromWishlistItemById } from '../controllers/wishlistController.js';
import { userActionRateLimiter } from '../middleware/securityMiddleware.js';
import { validateObjectIdParam, validateUserProductRelationRequest } from '../middleware/requestValidation.js';

const router = express.Router();

router.get('/:userId', validateObjectIdParam('userId', 'userId'), getWishlistOfOneUser); 

router.post('/add', userActionRateLimiter, validateUserProductRelationRequest, AddToWishlistProducts);
router.delete('/remove/:id', userActionRateLimiter, validateObjectIdParam('id', 'id'), RemoveFromWishlistItemById);
export default router;
 