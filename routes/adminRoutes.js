import express from 'express';
import {
  signup,
  login,
  logout,
  checkAuth,
} from '../controllers/authController.js';
import { deleteProduct, getAllProductsForAdmin } from '../controllers/adminController/productController.js';
import { deleteUser, getAllUsers } from '../controllers/adminController/usersController.js';
import { getAllOrdersForAdmin } from '../controllers/adminController/ordersController.js';
import { getAllNotificationsForAdmin } from '../controllers/adminController/notificationsController.js';
import { getAllFeedback } from '../controllers/adminController/feedbackController.js';
import { banSeller, createSeller, deleteSellerById, getAllSellers, getSellerById, updateUploadLimit, upload } from '../controllers/adminController/sellerController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';
import { deleteReview, getAllReviews } from '../controllers/adminController/review.js';
import { validateUploadLimit } from '../middleware/validateUploadLimit.js';
import { validateAndSanitizeAdminLogin, validateAndSanitizeAdminRegistration } from '../middleware/validationMiddleware.js';

 
const router = express.Router();

router.post('/signup', validateAndSanitizeAdminRegistration, signup);
router.post('/login', validateAndSanitizeAdminLogin, login);
router.post('/logout', logout);
router.get('/check', checkAuth);

router.get('/products',requireAdminAuth, getAllProductsForAdmin);
router.delete('/products/delete/:productId',requireAdminAuth, deleteProduct);

router.get('/users',requireAdminAuth,  getAllUsers);
router.delete("/users/delete/:id",requireAdminAuth, deleteUser);

router.get("/orders",requireAdminAuth, getAllOrdersForAdmin)

router.get("/notifications",requireAdminAuth, getAllNotificationsForAdmin);

router.get('/feedbacks',requireAdminAuth, getAllFeedback);

router.post("/sellers/create",upload.single('profileImage') ,requireAdminAuth, createSeller);
router.get("/sellers/get/:id",requireAdminAuth, getSellerById);
router.get('/sellers/all',requireAdminAuth, getAllSellers)
router.delete("/sellers/delete/:sellerId",requireAdminAuth, deleteSellerById);
router.put('/sellers/update/:id', validateUploadLimit, requireAdminAuth, updateUploadLimit )
router.put('/sellers/ban/:sellerId', requireAdminAuth, banSeller)

router.get('/reviews/all', requireAdminAuth, getAllReviews);
router.delete('/reviews/delete/:reviewId',requireAdminAuth, deleteReview )
export default router;