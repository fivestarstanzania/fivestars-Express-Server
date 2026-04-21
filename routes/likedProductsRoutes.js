import express from 'express';
import { getLikedProductsOfOneUser, toggleLikedProducts } from '../controllers/likedProductsController.js';
import { userActionRateLimiter } from '../middleware/securityMiddleware.js';
import { validateObjectIdParam, validateUserProductRelationRequest } from '../middleware/requestValidation.js';

const router = express.Router();

router.get('/:userId', validateObjectIdParam('userId', 'userId'), getLikedProductsOfOneUser); 

router.post('/toggle', userActionRateLimiter, validateUserProductRelationRequest, toggleLikedProducts);
export default router;
 