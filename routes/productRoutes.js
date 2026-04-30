import express from 'express';
import upload from "../middleware/multer.js";
import {
    getCategoryProduct, 
    getAllProducts, 
    getProduct, 
    searchProduct, 
    editProduct, 
    deleteProduct, 
    getSellerProducts, 
    updateProduct, 
    createLogClickedProducts,
    getLimitedDiscountedProducts,
    getDiscountedProducts,
    getUserProductCount,
    createProduct,
    getAllProductIds,
    getProductsByIds,
    getLatestProducts,
    getSellerProductById,
 } from '../controllers/productsController.js';
import { getPopularProducts } from '../controllers/ProductLog.js';
import { productMutationRateLimiter, reviewRateLimiter } from '../middleware/securityMiddleware.js';
import { validateEditProductRequest, validateObjectIdParam, validateProductBatchRequest, validateProductClickRequest, validateProductCreateRequest, validateProductUpdateRequest } from '../middleware/requestValidation.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadImages } from '../middleware/multer.js';

const router = express.Router();


// --- 1. STATIC GET ROUTES (Most Specific) ---
// Put these first so they don't get intercepted by dynamic parameters

// Get limited discounted products for home screen
router.get('/limited', getLimitedDiscountedProducts);
// Get all discounted products with pagination and sorting
router.get('/all', getDiscountedProducts);
router.get('/category', getCategoryProduct); 
router.get('/analytics/popular', getPopularProducts)
router.get('/seller/count',getUserProductCount);
router.get("/seller", getSellerProducts);
router.get('/latest', getLatestProducts);
router.get('/ids', getAllProductIds);// MUST be above /:id

// --- 2. DYNAMIC GET ROUTES (Pattern Matching) ---
router.get('/search/:key', searchProduct);
router.get('/seller/product/:id', authMiddleware, validateObjectIdParam('id', 'id'), getSellerProductById);
router.get('/:id', getProduct);


// --- 3. ROOT GET ROUTE (Least Specific) ---
router.get('/', getAllProducts);

// --- 4. POST ROUTES ---
router.post('/upload', productMutationRateLimiter, uploadImages, validateProductCreateRequest, createProduct);
router.post('/log-click', reviewRateLimiter, validateProductClickRequest, createLogClickedProducts);
router.post('/analytics/click', reviewRateLimiter, validateProductClickRequest, createLogClickedProducts)
router.post('/batch', productMutationRateLimiter, validateProductBatchRequest, getProductsByIds);

// --- 5. UPDATE & DELETE ROUTES ---
router.put('/edit', productMutationRateLimiter, validateEditProductRequest, editProduct);
router.patch('/update/:productId', productMutationRateLimiter, validateProductUpdateRequest, updateProduct);
router.delete('/delete/:productId', productMutationRateLimiter, validateObjectIdParam('productId', 'productId'), deleteProduct);

export default router;
 