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
import { createSeller, deleteSellerById, getAllSellers, getSellerById, upload } from '../controllers/adminController/sellerController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/check', checkAuth);

router.get('/products',requireAdminAuth, getAllProductsForAdmin);
router.delete('/products/delete/:productId',requireAdminAuth, deleteProduct);

router.get('/users',requireAdminAuth,  getAllUsers);
router.delete("/users/delete/:id",requireAdminAuth, deleteUser);

router.get("/orders",requireAdminAuth, getAllOrdersForAdmin)

router.get("/notifications",requireAdminAuth, getAllNotificationsForAdmin);

router.get('/feedbacks',requireAdminAuth, getAllFeedback);

router.post("/sellers/create",upload.single('profileImage'),requireAdminAuth, createSeller);
router.get("/sellers/get/:id",requireAdminAuth, getSellerById);
router.get('/sellers/all',requireAdminAuth, getAllSellers)
router.delete("/sellers/delete/:id",requireAdminAuth, deleteSellerById);

export default router;