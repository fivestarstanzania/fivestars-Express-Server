import express from 'express';
import {
  signup,
  login,
  logout,
  checkAuth,
} from '../controllers/authController.js';

import { 
  deleteProduct, 
  getAllProductsForAdmin, 
  getProductById, 
  updateProduct 
} from '../controllers/adminController/productController.js';

import { 
  adminGetUserDetails, 
  deleteUser, 
  getAllUsers 
} from '../controllers/adminController/usersController.js';

import { deleteOrderById, getAllOrdersForAdmin, getOrderById, updateOrder } from '../controllers/adminController/ordersController.js';

import { 
  adminBroadcastNotification, 
  adminSendNotification, 
  deleteNotification, 
  getAllNotificationsForAdmin, 
  getNotificationDetail, 
  markNotificationRead, 
  updateNotification 
} from '../controllers/adminController/notificationsController.js';

import { getAllFeedback } from '../controllers/adminController/feedbackController.js';

import { 
  banSeller, 
  createSeller, 
  deleteSellerById, 
  getAllSellers, 
  getSellerById, 
  updateUploadLimit, 
  upload, 
  getAllSellerApplications, 
  getSellerApplicationById, 
  updateSellerApplication, 
  rejectSellerApplication, 
  deleteSellerApplication, 
  approveSellerApplication 
} from '../controllers/adminController/sellerController.js';

import { requireAdminAuth } from '../middleware/authMiddleware.js';

import { deleteReview, getAllReviews, getReviewDetail } from '../controllers/adminController/review.js';

import { validateUploadLimit } from '../middleware/validateUploadLimit.js';
import { validateAndSanitizeAdminLogin, validateAndSanitizeAdminRegistration } from '../middleware/validationMiddleware.js';

import { getDashboardStats } from '../controllers/adminController/dashboardController.js';

import { 
  getSearchAnalytics, 
  getSearchTrends, 
  getZeroResultSummary 
} from '../controllers/adminController/searchAnalyticsController.js';

import { 
  getClickAnalytics, 
  getClickSummary 
} from '../controllers/adminController/clickAnalyticsController.js';
import { sanitizeProductUpdate } from '../middleware/sanitizeUpdateData.js';
import { deleteWishlist, getAllWishlists, getMostWishlistedProducts } from '../controllers/adminController/wishlistController.js';
import { getBestSellingProducts, getDailyRevenueTrend, getOrderStatistics, getOrdersTrend } from '../controllers/adminController/orderAnalytics.js';
import { getVisitorStats, getVisitorsTrend } from '../controllers/adminController/visitorsController.js';
import { adminAuthRateLimiter, notificationRateLimiter, productMutationRateLimiter, sellerActionRateLimiter, userActionRateLimiter } from '../middleware/securityMiddleware.js';
import { validateAdminBroadcastRequest, validateAdminNotificationReadRequest, validateAdminNotificationSendRequest, validateAdminNotificationUpdateRequest, validateObjectIdParam } from '../middleware/requestValidation.js';

const router = express.Router();

/* AUTH */
router.post('/signup', adminAuthRateLimiter, validateAndSanitizeAdminRegistration, signup);
router.post('/login', adminAuthRateLimiter, validateAndSanitizeAdminLogin, login);
router.post('/logout', userActionRateLimiter, logout);
router.get('/check', checkAuth);

/* PRODUCTS */
router.get('/products', requireAdminAuth, getAllProductsForAdmin);
router.delete('/products/delete/:productId', requireAdminAuth, productMutationRateLimiter, validateObjectIdParam('productId', 'productId'), deleteProduct);
router.put('/products/update/:id', requireAdminAuth, productMutationRateLimiter, validateObjectIdParam('id', 'id'), sanitizeProductUpdate, updateProduct);

/* --- SEARCH ANALYTICS --- */
router.get('/products/searches',requireAdminAuth, getSearchAnalytics);
router.get('/products/search-trends',requireAdminAuth, getSearchTrends);
router.get('/products/zero-result-summary',requireAdminAuth, getZeroResultSummary);   // ✅ fixed

/* --- CLICK ANALYTICS --- */
router.get('/products/clicks', requireAdminAuth, getClickAnalytics);
router.get('/products/click-summary', requireAdminAuth, getClickSummary);

/* IMPORTANT: This must stay LAST */
router.get('/products/:id', requireAdminAuth, validateObjectIdParam('id', 'id'), getProductById);
router.put('/products/update/:id', requireAdminAuth, productMutationRateLimiter, validateObjectIdParam('id', 'id'), updateProduct);

/* USERS */
router.get('/users', requireAdminAuth, getAllUsers);
router.get("/users/:id/details", requireAdminAuth, validateObjectIdParam('id', 'id'), adminGetUserDetails);
router.delete("/users/delete/:id", requireAdminAuth, userActionRateLimiter, validateObjectIdParam('id', 'id'), deleteUser);


/* ORDERS LIST */
router.get("/orders", requireAdminAuth, getAllOrdersForAdmin);

/* ANALYTICS */
router.get('/orders/revenue-trend', requireAdminAuth, getDailyRevenueTrend);
router.get('/orders/orders-trend', requireAdminAuth, getOrdersTrend);
router.get('/visitors/trend', requireAdminAuth, getVisitorsTrend)
router.get('/visitors/stats', requireAdminAuth, getVisitorStats)
router.get('/orders/best-sellers', requireAdminAuth, getBestSellingProducts);
router.get('/orders/statistics', requireAdminAuth, getOrderStatistics);

/* CRUD WITH DYNAMIC PARAMS */
router.get("/orders/:id/details", requireAdminAuth, validateObjectIdParam('id', 'id'), getOrderById);
router.put("/orders/update/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), updateOrder);
router.delete("/orders/delete/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), deleteOrderById);


/* NOTIFICATIONS */
router.get("/notifications", requireAdminAuth, getAllNotificationsForAdmin);
router.post('/users/:id/notifications', requireAdminAuth, notificationRateLimiter, validateAdminNotificationSendRequest, adminSendNotification);
router.post('/notifications/send-to-all', requireAdminAuth, notificationRateLimiter, validateAdminBroadcastRequest, adminBroadcastNotification);
router.get("/notifications/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), getNotificationDetail);
router.delete("/notifications/delete/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), deleteNotification);
router.patch("/notifications/:id/read", requireAdminAuth, notificationRateLimiter, validateAdminNotificationReadRequest, markNotificationRead);
router.put("/notifications/:id", requireAdminAuth, notificationRateLimiter, validateAdminNotificationUpdateRequest, updateNotification);

/* FEEDBACK */
router.get('/feedbacks', requireAdminAuth, getAllFeedback);

/* SELLERS */
router.post("/sellers/create", requireAdminAuth, sellerActionRateLimiter, upload.single('profileImage'),  createSeller);
router.get("/sellers/get/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), getSellerById);
router.get('/sellers/all',  requireAdminAuth, getAllSellers);
router.delete("/sellers/delete/:sellerId", requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('sellerId', 'sellerId'), deleteSellerById);
router.put('/sellers/update/:id', requireAdminAuth, validateUploadLimit, updateUploadLimit);
router.put('/sellers/ban/:sellerId', requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('sellerId', 'sellerId'), banSeller);

/* SELLER APPLICATIONS */
router.get('/seller-applications', requireAdminAuth, getAllSellerApplications);
router.get('/sellers/applications/:id', requireAdminAuth, validateObjectIdParam('id', 'id'), getSellerApplicationById);
router.put('/sellers/applications/:id', requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('id', 'id'), updateSellerApplication);
router.patch('/sellers/applications/:id/reject', requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('id', 'id'), rejectSellerApplication);
router.patch('/sellers/applications/:applicationId/approve', requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('applicationId', 'applicationId'), approveSellerApplication);
router.delete('/sellers/applications/:id', requireAdminAuth, sellerActionRateLimiter, validateObjectIdParam('id', 'id'), deleteSellerApplication);

/* REVIEWS */
router.get('/reviews/all', requireAdminAuth, getAllReviews);
router.get('/reviews/:reviewId', requireAdminAuth, validateObjectIdParam('reviewId', 'reviewId'), getReviewDetail);
router.delete('/reviews/delete/:reviewId', requireAdminAuth, validateObjectIdParam('reviewId', 'reviewId'), deleteReview);

/* WISHLIST */
router.get("/wishlists", requireAdminAuth, getAllWishlists);
router.get("/wishlists/most-wishlisted", requireAdminAuth, getMostWishlistedProducts);
router.delete("/wishlists/delete/:id", requireAdminAuth, validateObjectIdParam('id', 'id'), deleteWishlist);

/* DASHBOARD */
router.get('/dashboard/stats', requireAdminAuth, getDashboardStats);

export default router;
